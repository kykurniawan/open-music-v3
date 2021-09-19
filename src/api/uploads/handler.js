const ClientError = require("../../exceptions/ClientError")
const process = require("process")

class UploadsHandler {
    constructor(service, validator) {
        this._service = service
        this._validator = validator

        this.postUploadImageHandler = this.postUploadImageHandler.bind(this)
    }

    async postUploadImageHandler({ payload }, h) {
        try {
            const { data } = payload

            this._validator.validateImageHeaders(data.hapi.headers)

            const filename = await this._service.writeFile(data, data.hapi)

            const response = h.response({
                status: "success",
                message: "Gambar berhasil diunggah",
                data: {
                    pictureUrl: `http://${process.env.APP_HOST}:${process.env.APP_PORT}/upload/pictures/${filename}`,
                },
            })
            response.code(201)
            return response
        } catch (error) {
            if (error instanceof ClientError) {
                const response = h.response({
                    status: "fail",
                    message: error.message,
                })
                response.code(error.statusCode)
                return response
            }

            // Server ERROR!
            const response = h.response({
                status: "error",
                message: "Maaf, terjadi kegagalan pada server kami.",
            })
            response.code(500)
            console.error(error)
            return response
        }
    }
}

module.exports = UploadsHandler