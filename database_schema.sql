
CREATE TABLE categories (
	id UUID NOT NULL, 
	name TEXT NOT NULL, 
	slug TEXT NOT NULL, 
	description TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (name), 
	UNIQUE (slug)
)

;


CREATE TABLE tags (
	id UUID NOT NULL, 
	name TEXT NOT NULL, 
	slug TEXT NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (name), 
	UNIQUE (slug)
)

;


CREATE TABLE users (
	id UUID NOT NULL, 
	supabase_user_id UUID NOT NULL, 
	email TEXT NOT NULL, 
	role VARCHAR(20), 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	UNIQUE (supabase_user_id), 
	UNIQUE (email)
)

;


CREATE TABLE artist_profiles (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	display_name TEXT NOT NULL, 
	bio TEXT, 
	avatar_url TEXT, 
	website_url TEXT, 
	stripe_account_id TEXT, 
	is_verified BOOLEAN NOT NULL, 
	address JSONB, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

;


CREATE TABLE artworks (
	id UUID NOT NULL, 
	artist_id UUID NOT NULL, 
	category_id UUID, 
	title TEXT, 
	description TEXT, 
	medium VARCHAR(100), 
	style VARCHAR(100), 
	dimensions VARCHAR(100), 
	price NUMERIC(10, 2), 
	status VARCHAR(20) NOT NULL, 
	view_count INTEGER NOT NULL, 
	search_vector TSVECTOR, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT artworks_status_check CHECK (status IN ('draft', 'published', 'sold', 'archived')), 
	FOREIGN KEY(artist_id) REFERENCES users (id) ON DELETE NO ACTION, 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE SET NULL
)

;


CREATE TABLE audit_logs (
	id UUID NOT NULL, 
	user_id UUID, 
	action TEXT NOT NULL, 
	entity_type TEXT NOT NULL, 
	entity_id UUID, 
	old_data JSONB, 
	new_data JSONB, 
	ip_address TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
)

;


CREATE TABLE buyer_profiles (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	display_name TEXT NOT NULL, 
	avatar_url TEXT, 
	shipping_address JSONB, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

;


CREATE TABLE notifications (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	type TEXT NOT NULL, 
	title TEXT NOT NULL, 
	body TEXT NOT NULL, 
	data JSONB, 
	is_read BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

;


CREATE TABLE ai_jobs (
	id UUID NOT NULL, 
	artwork_id UUID NOT NULL, 
	job_type TEXT NOT NULL, 
	status TEXT NOT NULL, 
	celery_task_id TEXT, 
	result JSONB, 
	error TEXT, 
	retries INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT ai_jobs_type_check CHECK (job_type IN ('captioning', 'pricing', 'recommendations')), 
	CONSTRAINT ai_jobs_status_check CHECK (status IN ('queued', 'running', 'done', 'failed')), 
	FOREIGN KEY(artwork_id) REFERENCES artworks (id) ON DELETE CASCADE
)

;


CREATE TABLE artwork_images (
	id UUID NOT NULL, 
	artwork_id UUID NOT NULL, 
	storage_path VARCHAR(500) NOT NULL, 
	is_primary BOOLEAN NOT NULL, 
	display_order INTEGER NOT NULL, 
	is_confirmed BOOLEAN NOT NULL, 
	width INTEGER, 
	height INTEGER, 
	file_size_bytes INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(artwork_id) REFERENCES artworks (id) ON DELETE CASCADE
)

;


CREATE TABLE artwork_tags (
	artwork_id UUID NOT NULL, 
	tag_id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (artwork_id, tag_id), 
	FOREIGN KEY(artwork_id) REFERENCES artworks (id) ON DELETE CASCADE, 
	FOREIGN KEY(tag_id) REFERENCES tags (id) ON DELETE CASCADE
)

;


CREATE TABLE favorites (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	artwork_id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_favorites_user_artwork UNIQUE (user_id, artwork_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(artwork_id) REFERENCES artworks (id) ON DELETE CASCADE
)

;


CREATE TABLE orders (
	id UUID NOT NULL, 
	buyer_id UUID NOT NULL, 
	artwork_id UUID NOT NULL, 
	amount NUMERIC(10, 2) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	shipping_details JSONB, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')), 
	FOREIGN KEY(buyer_id) REFERENCES users (id) ON DELETE NO ACTION, 
	FOREIGN KEY(artwork_id) REFERENCES artworks (id) ON DELETE NO ACTION
)

;

