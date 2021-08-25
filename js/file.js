const BACKUP_CHECK_DELAY = 10 * 60000;

var timestamp = new Date().getTime();
var rrIntervalFilename = 'rrInterval.sosw', rrIntervalDataSource = 41, rrIntervalLastSyncTimestamp = timestamp;
var ppgFilename = 'ppgLightIntensity.sosw', ppgDataSource = 43, ppgLastSyncTimestamp = timestamp;
var activityFilename = 'activity.sosw', activityDataSource = 45, activityLastSyncTimestamp = timestamp;
var ambientLightFilename = 'ambientLight.sosw', ambientLightDataSource = 44, ambientLastSyncTimestamp = timestamp;
var heartRateFilename = 'heartRate.sosw', heartRateDataSource = 46, heartRateLastSyncTimestamp = timestamp;
var accelerometerFilename = 'accelerometer.sosw', accelerometerDataSource = 42, accelerometerLastSyncTimestamp = timestamp;

// binding each filestream separately
function bindRrInterval() {
	var file = tizen.filesystem.openFile("documents/" + rrIntervalFilename, "a");
	if (file == null) {
		documentsDir.createFile(rrIntervalFilename);
	} else {
		file.close();
	}
}
function bindHeartRate() {
	var file = tizen.filesystem.openFile("documents/" + heartRateFilename, "a");
	if (file == null) {
		documentsDir.createFile(heartRateFilename);
	} else {
		file.close();
	}
}
function bindPpg() {
	var file = tizen.filesystem.openFile("documents/" + ppgFilename, "a");
	if (file == null) {
		documentsDir.createFile(ppgFilename);
	} else {
		file.close();
	}
}
function bindActivity() {
	var file = tizen.filesystem.openFile("documents/" + activityFilename, "a");
	if (file == null) {
		documentsDir.createFile(activityFilename);
	} else {
		file.close();
	}
}
function bindAmbientLight() {
	var file = tizen.filesystem.openFile("documents/" + ambientLightFilename, "a");
	if (file == null) {
		documentsDir.createFile(ambientLightFilename);
	} else {
		file.close();
	}
}
function bindAccelerometer() {
	var file = tizen.filesystem.openFile("documents/" + accelerometerFilename, "a");
	if (file == null) {
		documentsDir.createFile(accelerometerFilename);
	} else {
		file.close();
	}
}
// binding all filestreams
function bindFilestreams() {
	bindRrInterval();
	bindHeartRate();
	bindPpg();
	bindActivity();
	bindAmbientLight();
	bindAccelerometer();
}

// submitting each data source separately
function backupRRInterval(timestamp) {
	tizen.filesystem.copyFile("documents/" + rrIntervalFilename, "documents/" + timestamp.toString() + rrIntervalFilename);
	tizen.filesystem.openFile("documents/" + rrIntervalFilename, "w").close();
}
function backupPPG(timestamp) {
	tizen.filesystem.copyFile("documents/" + ppgFilename, "documents/" + timestamp.toString() + ppgFilename);
	tizen.filesystem.openFile("documents/" + ppgFilename, "w").close();
}
function backupActivity(timestamp) {
	tizen.filesystem.copyFile("documents/" + activityFilename, "documents/" + timestamp.toString() + activityFilename);
	tizen.filesystem.openFile("documents/" + activityFilename, "w").close();
}
function backupAmbientLight(timestamp) {
	tizen.filesystem.copyFile("documents/" + ambientLightFilename, "documents/" + timestamp.toString() + ambientLightFilename);
	tizen.filesystem.openFile("documents/" + ambientLightFilename, "w").close();
}
function backupHeartRate(timestamp) {
	tizen.filesystem.copyFile("documents/" + heartRateFilename, "documents/" + timestamp.toString() + heartRateFilename);
	tizen.filesystem.openFile("documents/" + heartRateFilename, "w").close();
}
function backupAccelerometer(timestamp) {
	tizen.filesystem.copyFile("documents/" + accelerometerFilename, "documents/" + timestamp.toString() + accelerometerFilename);
	tizen.filesystem.openFile("documents/" + accelerometerFilename, "w").close();
}


// saving a sampled data
function saveRRIntervalSample(sample) {
	var file = tizen.filesystem.openFile("documents/" + rrIntervalFilename, "a");
	file.writeString(rrIntervalDataSource + ',' + sample + '\n');
	file.close();

	var timestamp = new Date().getTime();
	if (timestamp - rrIntervalLastSyncTimestamp > BACKUP_CHECK_DELAY) {
		backupRRInterval(timestamp);
		rrIntervalLastSyncTimestamp = timestamp;
	}
}
function savePPGSample(sample) {
	var file = tizen.filesystem.openFile("documents/" + ppgFilename, "a");
	file.writeString(ppgDataSource + ',' + sample + '\n');
	file.close();

	var timestamp = new Date().getTime();
	if (timestamp - ppgLastSyncTimestamp > BACKUP_CHECK_DELAY) {
		backupPPG(timestamp);
		ppgLastSyncTimestamp = timestamp;
	}
}
function saveActivitySample(sample) {
	var file = tizen.filesystem.openFile("documents/" + activityFilename, "a");
	file.writeString(activityDataSource + ',' + sample + '\n');
	file.close();

	var timestamp = new Date().getTime();
	if (timestamp - activityLastSyncTimestamp > BACKUP_CHECK_DELAY) {
		backupActivity(timestamp);
		activityLastSyncTimestamp = timestamp;
	}
}
function saveAmbientLightSample(sample) {
	var file = tizen.filesystem.openFile("documents/" + ambientLightFilename, "a");
	file.writeString(ambientLightDataSource + ',' + sample + '\n');
	file.close();

	var timestamp = new Date().getTime();
	if (timestamp - ambientLastSyncTimestamp > BACKUP_CHECK_DELAY) {
		backupAmbientLight(timestamp);
		ambientLastSyncTimestamp = timestamp;
	}
}
function saveHeartRateSample(sample) {
	var file = tizen.filesystem.openFile("documents/" + heartRateFilename, "a");
	file.writeString(heartRateDataSource + ',' + sample + '\n');
	file.close();

	var timestamp = new Date().getTime();
	if (timestamp - heartRateLastSyncTimestamp > BACKUP_CHECK_DELAY) {
		backupHeartRate(timestamp);
		heartRateLastSyncTimestamp = timestamp;
	}
}
function saveAccelerometerSample(sample) {
	var file = tizen.filesystem.openFile("documents/" + accelerometerFilename, "a");
	file.writeString(accelerometerDataSource + ',' + sample + '\n');
	file.close();

	var timestamp = new Date().getTime();
	if (timestamp - accelerometerLastSyncTimestamp > BACKUP_CHECK_DELAY) {
		backupAccelerometer(timestamp);
		accelerometerLastSyncTimestamp = timestamp;
	}
}