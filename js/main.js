window.onload = function() {
	document.addEventListener('tizenhwkey', function(e) {
		if (e.keyName == "back")
			tizen.application.getCurrentApplication().hide();
	});

	// bind views
	statusText = document.getElementById("status_text");
	localDataSizeText = document.getElementById("local_data_size_text");

	// hold the CPU lock
	tizen.power.request("CPU", "CPU_AWAKE");
	tizen.power.request("SCREEN", "SCREEN_NORMAL");

	// acquire permissions and start data collection
	tizen.ppm.requestPermission("http://tizen.org/privilege/mediastorage",
			function() {
				tizen.ppm.requestPermission(
						"http://tizen.org/privilege/healthinfo", function() {
							tizen.filesystem.resolve("documents",
									function(dir) {
										documentsDir = dir;
										bindFilestreams();
										startSensing();
										// console.log('sensing started');
									}, function(error) {
										// console.log('resolve error : ' +
										// error.message);
									}, "rw");
						}, function(error) {
							// console.log('resolve permission error : ' +
							// error.message);
						});
			}, function(error) {
				// console.log('resolve permission error : ' + error.message);
			});

	tizen.power.setScreenStateChangeListener(function(oldState, newState) {
		if (newState !== "SCREEN_BRIGHT" || !tizen.power.isScreenOn()) {
			tizen.power.turnScreenOn();
			tizen.power.setScreenBrightness(1);
		}
	});
};

// variables
var ppgSensor, linearAccelerationSensor, lightSensor;
var listenerIdWalking, listenerIdRunning, listenerIdStationary;
var statusText;
var localDataSizeText;
var appStatus = false;
var appVibrate = false;
var uploading = false;
var documentsDir;

function startHeartRateCollection() {
	appStatus = true;
	tizen.humanactivitymonitor.start('HRM', function(hrmInfo) {
		var timestamp = new Date().getTime();
		saveRRIntervalSample(timestamp + ',' + hrmInfo.rRInterval);
		saveHeartRateSample(timestamp + ',' + hrmInfo.heartRate);
		if (hrmInfo.heartRate <= 0) {
			tizen.application.launch("WGvCVP8H7a.SAPTizenClient");
		}
	}, function(error) {
		// console.log('error : ' + error);
	});
	// console.log('HRM started');
}
function startHRMRawCollection() {
	ppgSensor = tizen.sensorservice.getDefaultSensor("HRM_RAW");
	ppgSensor.start(function() {
		var listener = function(ppgData) {
			var timestamp = new Date().getTime();
			savePPGSample(timestamp + "," + ppgData.lightIntensity);
		};
		var onerror = function() {
			// console.log("error occurred:" + error);
		};

		ppgSensor.getHRMRawSensorData(listener, onerror);
		ppgSensor.setChangeListener(listener, 10);
	}, function(error) {
		// console.log('error : ' + error.message);
	});
	// console.log('HRM Raw collection started');
}
function startLinearAccelerationCollection() {
	linearAccelerationSensor = tizen.sensorservice
			.getDefaultSensor("LINEAR_ACCELERATION");
	linearAccelerationSensor.start(function() {
		var listener = function(accData) {
			var timestamp = new Date().getTime();
			saveAccelerometerSample(timestamp + "," + accData.x + ","
					+ accData.y + "," + accData.z);
		};
		var onerror = function(error) {
			// console.log('error : ' + error);
		};
		linearAccelerationSensor.getLinearAccelerationSensorData(listener,
				onerror);
		linearAccelerationSensor.setChangeListener(listener, 50);
	});
	// console.log('Linear acc collection started');
}
function startAmbientLightCollection() {
	lightSensor = tizen.sensorservice.getDefaultSensor("LIGHT");
	lightSensor.start(function() {
		var listener = function(lightData) {
			var timestamp = new Date().getTime();
			saveAmbientLightSample(timestamp + "," + lightData.lightLevel);
		};
		var onerror = function(error) {
			// console.log('error : ' + error);
		};
		lightSensor.getLightSensorData(listener, onerror);
		lightSensor.setChangeListener(listener, 1000);
	});
	// console.log('Ambient light sensor start');
}
function startActivityDetection() {
	var listener = function(activityInfo) {
		// console.log('Activity');
		var timestamp = new Date().getTime();
		saveActivitySample(timestamp + "," + activityInfo.type);
	};
	var onerror = function(error) {
		// console.log('error : ' + error.message);
	};
	listenerIdWalking = tizen.humanactivitymonitor
			.addActivityRecognitionListener('WALKING', listener, onerror);
	listenerIdWalking = tizen.humanactivitymonitor
			.addActivityRecognitionListener('RUNNING', listener, onerror);
	listenerIdWalking = tizen.humanactivitymonitor
			.addActivityRecognitionListener('STATIONARY', listener, onerror);
	listenerIdWalking = tizen.humanactivitymonitor
			.addActivityRecognitionListener('IN_VEHICLE', listener, onerror);
}
// sensing overall
function startSensing() {
	startHeartRateCollection();
	startHRMRawCollection();
	startLinearAccelerationCollection();
	startAmbientLightCollection();
	startActivityDetection();
}

// GUI
function aboutClick() {
	alert("It collects health and behavioral data for a stress sensing study. Have a nice day =)");
}
function exitApp() {
	tizen.application.getCurrentApplication().exit();
}
function checkDataSize() {
	documentsDir.listFiles(function(files) {
		var count = 0;
		for (var i = 0; i < files.length; i++) {
			if (/^\d+.+\.sosw$/.test(files[i].name))
				count += 1;
		}
		alert(count + ' files need to be transfered!');
	}, function(error) {
		// console.log('error : ' + error);
	});
}

function uploadSuccess(r) {
	console.log('Code = ' + r.responseCode);
	console.log('Response = ' + r.response);
	console.log('Sent = ' + r.bytesSent);
};
function uploadFailure(error) {
	alert('An error has occurred: Code = ' + error.code);
	console.log('upload error source ' + error.source);
	console.log('upload error target ' + error.target);
};

function compareFiles(a, b) {
	if (a.name < b.name)
		return -1;
	else if (a.name > b.name)
		return 1;
	else
		return 0;
}

function uploadData() {
	if (!uploading) {
		uploading = true;
		documentsDir.listFiles(function(files) {
			files.sort(compareFiles);
			for (var i = 0; i < files.length; i++) {
				var formData = new FormData();
				var file = tizen.filesystem.openFile("documents/" + files[i].name, "rw");
				var fileContent = file.readString();
				file.close();
				formData.append(files[i].name, fileContent);
				
				jQuery.ajax({
					url : 'http://165.246.42.172/api/submit_data',
					data : formData,
					cache : false,
					contentType : false,
					processData : false,
					method : 'POST',
					type : 'POST',
					success : function(res) {
						alert(res);
						uploading = false;
					}
				});
				
				break;
			}
		}, function(error) {
			// console.log('error : ' + error);
			uploading = false;
		});
	}
}