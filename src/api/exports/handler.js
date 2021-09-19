class ExportsHandler {
    constructor(service, playlistsService, validator) {
        this._service = service
        this._playlistsService = playlistsService
        this._validator = validator

        this.postExportPlaylistHandler = this.postExportPlaylistHandler.bind(this)
    }

    async postExportPlaylistHandler({ payload, auth, params }, h) {
        this._validator.validateExportPlaylistPayload(payload)
        const { id: ownerId } = auth.credentials
        const { playlistId } = params

        await this._playlistsService.verifyPlaylistOwner(playlistId, ownerId)

        const message = {
            playlistId: playlistId,
            targetEmail: payload.targetEmail,
        }

        await this._service.sendMessage("export:playlist", JSON.stringify(message))

        const response = h.response({
            status: "success",
            message: "Permintaan Anda dalam antrean",
        })
        response.code(201)
        return response
    }
}

module.exports = ExportsHandler