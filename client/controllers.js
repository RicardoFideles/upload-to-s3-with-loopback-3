const base_url = 'http://localhost:3000/api/files';

angular.module('app', ['angularFileUpload'])

  .controller('TestController',function ($scope, FileUploader) {
    'use strict';
    
    var uploader = $scope.uploader = new FileUploader({
      scope: $scope,                         
      url: `${base_url}/upload`,
      formData: [
        { key: 'value' }
      ]
    });

    uploader.filters.push({
        name: 'filterName',
        fn: function (item, options) {
            console.info('filter2');
            return true;
        }
    });

    uploader.onAfterAddingFile = function(item) {
      console.info('After adding a file', item);
    };
    uploader.onAfterAddingAll = function(items) {
      console.info('After adding all files', items);
    };
    uploader.onWhenAddingFileFailed = function(item, filter, options) {
      console.info('When adding a file failed', item);
    };
    uploader.onBeforeUploadItem = function(item) {
      console.info('Before upload', item);
    };
    uploader.onProgressItem = function(item, progress) {
      console.info('Progress: ' + progress, item);
    };
    uploader.onProgressAll = function(progress) {
      console.info('Total progress: ' + progress);
    };
    uploader.onSuccessItem = function(item, response, status, headers) {
      console.info('Success', response, status, headers);
      $scope.$broadcast('uploadCompleted', item);
    };
    uploader.onErrorItem = function(item, response, status, headers) {
      console.info('Error', response, status, headers);
    };
    uploader.onCancelItem = function(item, response, status, headers) {
      console.info('Cancel', response, status);
    };
    uploader.onCompleteItem = function(item, response, status, headers) {
      console.info('Complete', response, status, headers);
    };
    uploader.onCompleteAll = function() {
      console.info('Complete all');
    };
  }
).controller('FilesController', function ($scope, $http) {

    $scope.load = function () {
      $http.get(`${base_url}`).success(function (data) {
        console.log(data);
        $scope.files = data;
      });
    };

    $scope.delete = function (index, id) {
      $http.delete(`${base_url}/` + encodeURIComponent(id)).success(function (data, status, headers) {
        $scope.files.splice(index, 1);
      });
    };

    $scope.$on('uploadCompleted', function(event) {
      console.log('uploadCompleted event received');
      $scope.load();
    });

  });
