const { Pool } = require("pg")
const { nanoid } = require("nanoid")
const InvariantError = require("../../exceptions/InvariantError")
const NotFoundError = require("../../exceptions/NotFoundError")
const ClientError = require("../../exceptions/ClientError")

class PlaylistsService {

    constructor(cacheService) {
        this._pool = new Pool()
        this._cacheService = cacheService
    }

    async addPlaylist({ name }, owner) {
        const id = `playlist-${nanoid(16)}`

        const query = {
            text: "INSERT INTO playlists VALUES($1, $2, $3) RETURNING id",
            values: [id, name, owner],
        }

        const result = await this._pool.query(query)

        if (!result.rows[0].id) {
            throw new InvariantError("playlist gagal ditambahkan")
        }

        return result.rows[0].id
    }

    async addPlaylistSong({ songId }, playlistId, owner) {
        const id = "playlistsong-" + nanoid(16)

        const playlist = await this.getPlaylistById(playlistId)

        if (playlist.owner != owner) {
            throw new ClientError("tidak memiliki izin untuk menambah lagu", 403)
        }

        const query = {
            text: "INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id",
            values: [id, playlistId, songId]
        }

        const result = await this._pool.query(query)

        if (!result.rows[0].id) {
            throw new InvariantError("lagu gagal ditambahkan ke playlist")
        }
        await this._cacheService.delete(`playlistsongs:${owner}:${playlistId}`)
        return result.rows[0].id
    }

    async getPlaylists(owner) {
        const query = {
            text: "SELECT playlists.id, playlists.name, users.username FROM playlists JOIN users ON users.id=playlists.owner WHERE playlists.owner=$1",
            values: [owner]
        }
        const result = await this._pool.query(query)
        return result.rows.map(({
            id,
            name,
            username,
        }) => ({
            id,
            name,
            username
        }))
    }

    async getPlaylistById(id) {
        const query = {
            text: "SELECT * FROM playlists WHERE id = $1",
            values: [id],
        }
        const result = await this._pool.query(query)

        if (!result.rows.length) {
            throw new NotFoundError("playlist tidak ditemukan")
        }

        return result.rows[0]
    }

    async getPlaylistSongs(playlistId, ownerId) {
        try {
            const result = await this._cacheService.get(`playlistsongs:${ownerId}:${playlistId}`)
            return JSON.parse(result)
        } catch (error) {

            const playlist = await this.getPlaylistById(playlistId)
            if (playlist.owner != ownerId) {
                throw new ClientError("tidak memiliki izin untuk melihat lagu", 403)
            }

            const query = {
                text: "SELECT songs.id, songs.title, songs.performer FROM playlistsongs JOIN songs ON playlistsongs.song_id=songs.id WHERE playlistsongs.playlist_id= $1",
                values: [playlistId]
            }

            const result = await this._pool.query(query)

            await this._cacheService.set(`playlistsongs:${ownerId}:${playlistId}`, JSON.stringify(result.rows))

            return result.rows
        }
    }

    async deletePlaylistById(id, ownerId) {
        const query = {
            text: "DELETE FROM playlists WHERE id = $1 RETURNING id",
            values: [id],
        }

        const playlist = await this.getPlaylistById(id)

        if (playlist.owner != ownerId) {
            throw new ClientError("tidak memiliki izin untuk menghapus", 403)
        }

        const result = await this._pool.query(query)
        if (!result.rows.length) {
            throw new NotFoundError("playlist gagal dihapus. Id tidak ditemukan")
        }
    }

    async deletePlaylistSongById({ songId }, playlistId, ownerId) {
        const playlist = await this.getPlaylistById(playlistId)
        if (playlist.owner != ownerId) {
            throw new ClientError("tidak memiliki izin untuk melihat lagu", 403)
        }

        const song = await this._pool.query("SELECT * FROM songs WHERE id='" + songId + "'")

        if (!song.rows.length) {
            throw new ClientError("ID lagu tidak valid", 400)
        }
        const query = {
            text: "DELETE FROM playlistsongs WHERE song_id = $1 AND playlist_id = $2 RETURNING id",
            values: [songId, playlistId],
        }

        const result = await this._pool.query(query)
        if (!result.rows.length) {
            throw new NotFoundError("Lagu gagal dihapus dari playlist. Id tidak ditemukan")
        }
        await this._cacheService.delete(`playlistsongs:${ownerId}:${playlistId}`)
    }

    async verifyPlaylistOwner(playlistId, ownerId) {
        const playlist = await this.getPlaylistById(playlistId)
        if (playlist.owner != ownerId) {
            throw new ClientError("tidak memiliki izin untuk mengexport playlist", 403)
        }
    }
}

module.exports = PlaylistsService