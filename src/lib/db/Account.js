class Account {
	constructor(sqlRow, db) {
		this.#db = db;
		this.id = sqlRow.id;
		this.username = sqlRow.username;
		this.displayName = sqlRow.display_name;
		this.encryptedPassword = sqlRow.password;
		this.createdAt = new Date(sqlRow.created_at);
		this.avatar_id = sqlRow.avatar_id;
		this.banner_id = sqlRow.banner_id;
		this.bio = sqlRow.bio;
		this.website = sqlRow.website;
		this.location = sqlRow.location;
		this.follows = sqlRow.follows;
		this.followers = sqlRow.followers;
		this.likes = sqlRow.likes;
		this.isAdmin = sqlRow.is_admin === 1;
		this.isSuspended = sqlRow.is_suspended === 1;
		this.isDeleted = sqlRow.is_deleted === 1;
	}

}
module.exports = Account;