// variables
const BACKUP_CHECK_DELAY = 10 * 60000;
var userId = null;
var timestamp = new Date().getTime();
var rrIntervalFilename = 'rrInterval.csv', rrIntervalDataSource = 1, rrIntervalLastSyncTimestamp = timestamp;
var ppgFilename = 'ppgLightIntensity.csv', ppgDataSource = 2, ppgLastSyncTimestamp = timestamp;
var accelerometerFilename = 'accelerometer.csv', accelerometerDataSource = 3, accelerometerLastSyncTimestamp = timestamp;
var uploading = false;

// init
window.onload = function() {
	document.addEventListener('tizenhwkey', function(e) {
		if (e.keyName == "back")
			tizen.application.getCurrentApplication().hide();
	});
	
	// hold the CPU lock
	tizen.power.request("CPU", "CPU_AWAKE");
	tizen.power.request("SCREEN", "SCREEN_NORMAL");
	
	// keep screen on
	tizen.power.setScreenStateChangeListener(function(oldState, newState) {
		if (newState !== "SCREEN_BRIGHT" || !tizen.power.isScreenOn()) {
			tizen.power.turnScreenOn();
			tizen.power.setScreenBrightness(1);
		}
	});
	
	// acquire permissions and start data collection
	tizen.ppm.requestPermission("http://tizen.org/privilege/mediastorage", function() {
		// check user ID
		var file = tizen.filesystem.openFile("documents/userId.txt", "rw");
		var fileContent = file.readString();
		file.close();
		if (fileContent.length > 0 && /^\d+$/.test(fileContent)) {
			userId = parseInt(fileContent);
			
			$('#userIdText').html('Current user ID : ' + userId + ' (LOGOUT)');
			$('#registerDiv').hide(500);
			$('#contentDiv').show(500);
			
			tizen.ppm.requestPermission("http://tizen.org/privilege/healthinfo", startSensing, function(error) {
				tizen.application.getCurrentApplication().exit();
			});
		}
	}, function(error) {
		tizen.application.getCurrentApplication().exit();
	});
};

// sensor event handlers
function saveRRIntervalSample(hrmInfo) {
	var file = tizen.filesystem.openFile("documents/" + rrIntervalFilename, "a");
	file.writeString(rrIntervalDataSource + ',' + new Date().getTime() + ',' + hrmInfo.rRInterval + '\n');
	file.close();

	var timestamp = new Date().getTime();
	if (timestamp - rrIntervalLastSyncTimestamp > BACKUP_CHECK_DELAY) {
		backupRRInterval(timestamp);
		rrIntervalLastSyncTimestamp = timestamp;
	}
}
function savePPGSample(ppgData) {
	var file = tizen.filesystem.openFile("documents/" + ppgFilename, "a");
	file.writeString(ppgDataSource + ',' + new Date().getTime() + ',' + ppgData.lightIntensity + '\n');
	file.close();

	var timestamp = new Date().getTime();
	if (timestamp - ppgLastSyncTimestamp > BACKUP_CHECK_DELAY) {
		backupPPG(timestamp);
		ppgLastSyncTimestamp = timestamp;
	}
}
function saveAccelerometerSample(accData) {
	var file = tizen.filesystem.openFile("documents/" + accelerometerFilename, "a");
	file.writeString(accelerometerDataSource + ',' + new Date().getTime() + ',' + accData.x + ',' + accData.y + ',' + accData.z + '\n');
	file.close();

	var timestamp = new Date().getTime();
	if (timestamp - accelerometerLastSyncTimestamp > BACKUP_CHECK_DELAY) {
		backupAccelerometer(timestamp);
		accelerometerLastSyncTimestamp = timestamp;
	}
}

// sensor data backup events
function backupRRInterval(timestamp) {
	tizen.filesystem.copyFile("documents/" + rrIntervalFilename, "documents/" + timestamp.toString() + rrIntervalFilename);
	tizen.filesystem.openFile("documents/" + rrIntervalFilename, "w").close();
}
function backupPPG(timestamp) {
	tizen.filesystem.copyFile("documents/" + ppgFilename, "documents/" + timestamp.toString() + ppgFilename);
	tizen.filesystem.openFile("documents/" + ppgFilename, "w").close();
}
function backupAccelerometer(timestamp) {
	tizen.filesystem.copyFile("documents/" + accelerometerFilename, "documents/" + timestamp.toString() + accelerometerFilename);
	tizen.filesystem.openFile("documents/" + accelerometerFilename, "w").close();
}

// trigger sensing
function startInterbeatIntervalCollection() {
	tizen.humanactivitymonitor.start('HRM', saveRRIntervalSample, function(error) { });
}
function startHRMRawCollection() {
	var ppgSensor = tizen.sensorservice.getDefaultSensor("HRM_RAW");
	ppgSensor.start(function() {
		ppgSensor.getHRMRawSensorData(savePPGSample, function(error) { });
		ppgSensor.setChangeListener(savePPGSample, 10);
	}, function(error) { });
}
function startLinearAccelerationCollection() {
	var linearAccelerationSensor = tizen.sensorservice.getDefaultSensor("LINEAR_ACCELERATION");
	linearAccelerationSensor.start(function() {
		linearAccelerationSensor.getLinearAccelerationSensorData(saveAccelerometerSample, function(error) { });
		linearAccelerationSensor.setChangeListener(saveAccelerometerSample, 10);
	});
}
function startSensing() {
	startInterbeatIntervalCollection();
	startHRMRawCollection();
	startLinearAccelerationCollection();
}

// GUI event handlers
function logout() {
	$('#contentDiv').hide(500);
	$('#registerDiv').show(500);
}
function exitApp() {
	tizen.application.getCurrentApplication().exit();
}
function login() {
	$('#loginButton').css('background-color', 'gray');
	var newUserId = window.prompt("User ID: ");
	if (/^\d+$/.test(newUserId)) {
		var formData = new FormData();
		formData.append('userId', newUserId);
		
		jQuery.ajax({
			url : 'http://165.246.42.172/api/login',
			data : formData,
			cache : false,
			contentType : false,
			processData : false,
			method : 'POST',
			type : 'POST',
			success : function(res) {
				if (res.success) {
					var file = tizen.filesystem.openFile("documents/userId.txt", "rw");
					file.writeString(res.userId.toString());
					file.close();
					userId = res.userId;
					
					$('#userIdText').html('Current user ID : ' + userId + ' (LOGOUT)');
					$('#registerDiv').hide(500);
					$('#contentDiv').show(500);
					
					tizen.ppm.requestPermission("http://tizen.org/privilege/healthinfo", startSensing, function(error) {
						tizen.application.getCurrentApplication().exit();
					});
				} else
					alert("Please double check your User ID!");
				$('#loginButton').css('background-color', 'green');					
			},
			error: function (req, status, err) {
				$('#loginButton').css('background-color', 'green');
				alert("Please recheck your internet connection!");
			}
		});
	}
}
function register() {
	$('#registerButton').css('background-color', 'gray');
	jQuery.ajax({
		url : 'http://165.246.42.172/api/register',
		data : new FormData(),
		cache : false,
		contentType : false,
		processData : false,
		method : 'POST',
		type : 'POST',
		success : function(res) {
			if (res.success) {
				tizen.ppm.requestPermission("http://tizen.org/privilege/mediastorage", function() {
					var file = tizen.filesystem.openFile("documents/userId.txt", "rw");
					file.writeString(res.userId.toString());
					file.close();
					userId = res.userId;
					
					$('#userIdText').html('Current user ID : ' + userId + ' (LOGOUT)');
					$('#registerDiv').hide(500);
					$('#contentDiv').show(500);
					
					tizen.ppm.requestPermission("http://tizen.org/privilege/healthinfo", startSensing, function(error) {
						tizen.application.getCurrentApplication().exit();
					});
					
					$('#registerButton').css('background-color', 'green');
				}, function(error) {
					tizen.application.getCurrentApplication().exit();
				});
			}
		},
		error: function (req, status, err) {
			$('#registerButton').css('background-color', 'green');
			alert("Please recheck your internet connection!");
		}
	});
}
function checkDataSize() {
	$('#localDataButton').css('background-color', 'gray');
	tizen.filesystem.listDirectory('documents', function(files) {
		var count = 0;
		for (var i = 0; i < files.length; i++)
			if (/^\d+[a-zA-Z]+\.csv$/.test(files[i]))
				count += 1;
		$('#localDataButton').css('background-color', 'green');
		alert(count + ' files need to be transfered!');
	}, function(error) {
		$('#localDataButton').css('background-color', 'green');
	});
}
function uploadData() {
	if (!uploading) {
		$('#uploadButton').css('background-color', 'gray');
		uploading = true;
		tizen.filesystem.listDirectory('documents', function(files) {
			files.sort();
			for (var i = 0; i < files.length; i++)
				if (/^\d+[a-zA-Z]+\.csv$/.test(files[i])) {
					var file = tizen.filesystem.openFile("documents/" + files[i], "rw");
					var fileContent = file.readString();
					file.close();
					
					var formData = new FormData();
					formData.append('userId', userId);
					formData.append(files[i], fileContent);
	
					jQuery.ajax({
						url : 'http://165.246.42.172/api/submit_data',
						data : formData,
						cache : false,
						contentType : false,
						processData : false,
						method : 'POST',
						type : 'POST',
						success : function(res) {
							if (res.success)
								for (var i = 0; i < res.fileNames.length; i++) {
									tizen.filesystem.deleteFile('documents/' + res.fileNames[i]);
									console.log(res.fileNames[i] + ' deleted');
								}
						},
						error: function (req, status, err) { }
					});
				}
			$('#uploadButton').css('background-color', 'green');
			uploading = false;
		}, function(error) {
			$('#uploadButton').css('background-color', 'green');
			uploading = false;
		});
	}
}