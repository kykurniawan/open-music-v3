class PlaylistsHandler {
    constructor(service, validator) {
        this._service = service
        this._validator = validator

        this.postPlaylistHandler = this.postPlaylistHandler.bind(this)
        this.postPlaylistSongHandler = this.postPlaylistSongHandler.bind(this)
        this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this)
        this.getPlaylistSongsHandler = this.getPlaylistSongsHandler.bind(this)
        this.deletePlaylistByIdHandler = this.deletePlaylistByIdHandler.bind(this)
        this.deletePlaylistSongByIdHandler = this.deletePlaylistSongByIdHandler.bind(this)
    }

    async postPlaylistHandler({ payload, auth }, h) {
        this._validator.validatePlaylistPayload(payload)
        const { id: ownerId } = auth.credentials
        const playlistId = await this._service.addPlaylist(payload, ownerId)

        const response = h.response({
            status: "success",
            message: "Playlist berhasil ditambahkan",
            data: {
                playlistId
            }
        })
        response.code(201)
        return response
    }

    async postPlaylistSongHandler({ payload, params, auth }, h) {
        this._validator.validatePlaylistSongPayload(payload)
        const { playlistId } = params
        const { id: ownerId } = auth.credentials

        await this._service.addPlaylistSong(payload, playlistId, ownerId)

        const response = h.response({
            status: "success",
            message: "Lagu berhasil ditambahkan ke playlist",
        })
        response.code(201)
        return response
    }

    async getPlaylistsHandler({ auth }) {
        const { id: ownerId } = auth.credentials
        const playlists = await this._service.getPlaylists(ownerId)
        return {
            status: "success",
            data: {
                playlists
            }
        }
    }

    async getPlaylistSongsHandler({ params, auth }) {
        const { playlistId } = params
        const { id: ownerId } = auth.credentials

        const playlistSongs = await this._service.getPlaylistSongs(playlistId, ownerId)
        return {
            status: "success",
            data: {
                songs: playlistSongs
            }
        }
    }

    async deletePlaylistByIdHandler({ params, auth }) {
        const { id } = params
        const { id: ownerId } = auth.credentials
        await this._service.deletePlaylistById(id, ownerId)
        return {
            status: "success",
            message: "playlist berhasil dihapus",
        }
    }

    async deletePlaylistSongByIdHandler({ payload, params, auth }) {
        const { playlistId } = params
        const { id: ownerId } = auth.credentials
        await this._service.deletePlaylistSongById(payload, playlistId, ownerId)
        return {
            status: "success",
            message: "Lagu berhasil dihapus dari playlist",
        }
    }
}

module.exports = PlaylistsHandler