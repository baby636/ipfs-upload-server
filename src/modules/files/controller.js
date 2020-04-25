/**
 * Controller class for file enpoints
 */


const File = require('../../models/files')

const config = require('../../../config')

let _this

class FileController {
  constructor() {
    _this = this
    this.File = File
    this.config = config
  }

  /**
   * @api {post} /files Create a new File
   * @apiPermission user
   * @apiName CreateFile
   * @apiGroup Files
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -H "Authorization: Bearer <JWT Token>" -X POST -d '{ "file": { "schemaVersion": 1 ,"timestamp":"utc"  } }' localhost:5001/files
   *
   * @apiParam {Object}  file File object (required)
   * @apiParam {Number}  file.schemaVersion (required)
   * @apiParam {String}  file.timestamp (required)
   * @apiParam {Number}  file.size (required)
   * @apiParam {String}  file.userId (optional)
   * @apiParam {Object}  file.meta (optional)
   *
   * @apiSuccess {Boolean}  success File creation status.
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true
   *     }
   *
   * @apiError UnprocessableEntity Missing required parameters
   *
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 422 Unprocessable Entity
   *     {
   *       "status": 422,
   *       "error": "Path `schemaVersion` is required"
   *     }
   */

  async createFile(ctx) {
    try {
      const file = new _this.File(ctx.request.body.file)

      // Input Validation.
      if (
        !file.schemaVersion ||
        typeof file.schemaVersion !== 'number'
      ) {
        throw new Error("Property 'schemaVersion' must be a number!")
      }
      if (
        !file.size ||
        typeof file.size !== 'number'
      ) {
        throw new Error("Property 'size' must be a number!")
      }


      // These properties shouldn't be sent in the petition,
      // because they're created by the controller
      // TODO: force-replace these properties so that we can remove the error
      // handling.
      if (file.updateIndex) {
        throw new Error("Property 'updateIndex' not allowed!")
      }
      if (file.createdTimestamp) {
        throw new Error("Property 'createdTimestamp' not allowed!")
      }
      if (file.lastAccessed) {
        throw new Error("Property 'lastAccessed' not allowed!")
      }

      // Set update index to default
      file.updateIndex = 1

      // Set current time
      file.createdTimestamp = new Date().getTime()

      await file.save()

      ctx.body = {
        success: true,
        file
      }
    } catch (err) {
      ctx.throw(422, err.message)
    }
  }

  /**
   * @api {get} /files Get all files
   * @apiPermission user
   * @apiName GetFiles
   * @apiGroup Files
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -H "Authorization: Bearer <JWT Token>" -X GET localhost:5001/files
   *
   * @apiSuccess {Object[]}  file File object (required)
   * @apiSuccess {Number}  file.schemaVersion (required)
   * @apiSuccess {String}  file.timestamp (required)
   * @apiSuccess {Number}  file.size (required)
   * @apiSuccess {String}  file.userId (optional)
   * @apiSuccess {Object}  file.meta (optional)
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *         "file":[{
   *         "_id":"5dc65c1dafbe60187afe2bf5",
   *         "schemaVersion":1,
   *         "timestamp":"utc","__v":0
   *         }]
   *     }
   *
   */
  async getFiles(ctx) {
    try {
      const files = await _this.File.find({})

      ctx.body = { files }
    } catch (error) {
      ctx.throw(404)
    }
  }

  /**
   * @api {get} /file/:id Get file by id
   * @apiPermission user
   * @apiName GetFile
   * @apiGroup Files
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -H "Authorization: Bearer <JWT Token>" -X GET localhost:5001/files/5dc65c1dafbe60187afe2bf5
   *
   * @apiSuccess {Object}   file                    file object
   * @apiSuccess {ObjectId} file._id                file id
   * @apiSuccess {Number}   file.schemaVersion (required)
   * @apiSuccess {String}   file.timestamp (required)
   * @apiSuccess {Number}   file.size (required)
   * @apiSuccess {String}   file.userId (optional)
   * @apiSuccess {Object}   file.meta (optional)
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *         "file":[{
   *         "_id":"5dc65c1dafbe60187afe2bf5",
   *         "schemaVersion":1,
   *         "timestamp":"utc","__v":0
   *         }]
   *     }
   *
   */

  async getFile(ctx, next) {
    try {
      const file = await _this.File.findById(ctx.params.id)

      if (!file) {
        ctx.throw(404)
      }

      ctx.body = {
        file
      }
    } catch (err) {
      if (err === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      ctx.throw(500)
    }

    if (next) {
      return next()
    }
  }

  /**
   * @api {put} /files/:id Update a file
   * @apiPermission user
   * @apiName UpdateFile
   * @apiGroup Files
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -H "Authorization: Bearer <JWT Token>" -X PUT -d '{ "file": { "schemaVersion": 1 ,"meta":"test1" } }' localhost:5001/files/5df85d4bf1cedc505be61807
   *
   * @apiParam {Object}  file File object (required)
   * @apiParam {Number}  file.schemaVersion (required)
   * @apiParam {String}  file.createdTimestamp (required)
   * @apiParam {Number}  file.size (required)
   * @apiParam {String}  file.lastAccessed (optional) .
   * @apiParam {String}  file.userIdUpload (optional) .
   * @apiParam {String}  file.payloadLink (optional).
   * @apiParam {String}  file.updateIndex (optional).
   * @apiParam {Object}  file.meta (optional) .
   *
   * @apiSuccess {Object}   file                    	file object
   * @apiSuccess {ObjectId} file._id                	file id
   * @apiSuccess {Number}   file.schemaVersion      	file version
   * @apiSuccess {String}   file.createdTimestamp   	Time file was uploaded
   * @apiSuccess {Number}   file.size (required)		Size of the file in bytes
   * @apiSuccess {String}   file.lastAccessed       	Last time the file was accessed.
   * @apiSuccess {String}   file.userIdUpload       	User that uploaded the file
   * @apiSuccess {String}   file.payloadLink        	IPFS hash of current file.
   * @apiSuccess {String}   file.updateIndex
   * @apiSuccess {Object}   file.meta
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *   "file":[{
   *   "_id":"5df85d4bf1cedc505be61807",
   *   "schemaVersion":1,
   *   "timestamp":"utc","__v":0
   *   }]
   *  }
   *
   * @apiError UnprocessableEntity Missing required parameters
   *
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 401 Unauthorized
   *{
   * "status": 401,
   * "error": "Unauthorized"
   *}
   *
   */
  async updateFile(ctx) {
    try {
      // Values obtain from user request.
      // This variable is intended to validate the properties
      // sent by the client
      const fileObj = ctx.request.body.file

      // values obtained from the search by file id
      const file = ctx.body.file
      // console.log(file)

      // Input validation
      if (
        fileObj.schemaVersion &&
        typeof fileObj.schemaVersion !== 'number'
      ) {
        throw new Error("Property 'schemaVersion' must be a number!")
      }

      if (
        fileObj.size &&
        typeof fileObj.size !== 'number'
      ) {
        throw new Error("Property 'size' must be a number!")
      }

      // This properties shouldn't be sent in the petition,
      // because they're created by the controller
      if (fileObj.updateIndex) {
        throw new Error("Property 'updateIndex' not allowed!")
      }
      if (fileObj.createdTimestamp) {
        throw new Error("Property 'createdTimestamp' not allowed!")
      }
      if (fileObj.lastAccessed) {
        throw new Error("Property 'lastAccessed' not allowed!")
      }

      Object.assign(file, fileObj)

      // Set current time
      file.lastAccessed = new Date().getTime()
      file.updateIndex = file.updateIndex + 1

      await file.save()

      ctx.body = {
        file
      }
    } catch (error) {
      ctx.throw(422, error.message)
    }
  }

}

module.exports = FileController