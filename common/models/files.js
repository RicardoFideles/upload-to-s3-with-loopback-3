'use strict';

const AWS = require('aws-sdk');
const { join, extname } = require('path');
const { readFileSync } = require('fs');
const ObjectId = require('mongodb').ObjectID;
const BUCKET_NAME = 's3-upload'
const multiparty = require('multiparty');

let s3 = null;

if (process.env.NODE_ENV == "local") {
  s3 = new AWS.S3({
    accessKeyId: process.env.minio_accessKeyId, 
    secretAccessKey: process.env.minio_secretAccessKey,
    endpoint: process.env.minio_endpoint,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  });
} else {
  s3 = new AWS.S3();
}


module.exports = function(Files) {

  const getFileFromRequest = (req) => new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      const file = files['file'][0];
      if (!file) {
        reject('Data not found in request.');
      } else {
        resolve(file);
      } 
    });
  });

  const uploadFileToS3 = (file) => {
    return new Promise((resolve, reject) => {
      try {
        const buffer = readFileSync(file.path);
        const fileName = String(Date.now());
        const extension = extname(file.path);
        let fileKey = join('documents/', `${fileName}${extension}`);
        let params = {
          Body: buffer,
          Bucket: BUCKET_NAME,
          Key: fileKey
        };
        s3.putObject(params, function (err, resp) {
          if (err) {
            return reject(err);
          }
          let itemUploaded = {
            eTag: resp.ETag,
            bucket: params.Bucket,
            key: params.Key
          };
          return resolve(itemUploaded);
        });
      } catch (error) {
        return reject(error);
      }
    });
  };

  /**
   * Upload Helper.
   * @param {Object} Files - Loopback Model
   * @param {String} id - File ID
   * @param {Request} req - Request.
   */
  const uploadManager = async (Files, req) => {

    try {
      const fileData = await getFileFromRequest(req);
      const itemUploaded = await uploadFileToS3(fileData);
      const createdFile = await Files.create(itemUploaded);
      Promise.resolve(createdFile);
    } catch (error) {
      Promise.reject(error);
    }
  }

  

  /**
   * Method for upload files to AWS S3 bucket.
   * @param {Function(Error)} callback
   */
  Files.upload = function(req, callback) {

    uploadManager(Files, req).then((res) => {
      callback(null, res);
    }).catch((error) => {
      callback(error);
    })
  }

  /**
   * 
   * @param {Function(Error)} callback
   */

  Files.download = function(req, res, callback) {
    try {
      let filter = null;
      if (req.query && req.query.filter) {
        filter = JSON.parse(req.query.filter);
      }

      var options = {
        Bucket: BUCKET_NAME,
        Key: filter.key,
      };

      res.attachment(filter.key);
      var fileStream = s3.getObject(options).createReadStream();
      fileStream.pipe(res);
      return;
    } catch (error) {
      callback(error);
    }
  };

};
