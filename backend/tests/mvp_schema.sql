CREATE TABLE organizations (
	id INTEGER NOT NULL,
	name VARCHAR NOT NULL,
	website VARCHAR,
	industry VARCHAR,
	notes TEXT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id)
);
CREATE TABLE contacts (
	id INTEGER NOT NULL,
	name VARCHAR NOT NULL,
	email VARCHAR,
	phone VARCHAR,
	job_title VARCHAR,
	organization_id INTEGER,
	status VARCHAR NOT NULL,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(organization_id) REFERENCES organizations (id)
);
CREATE INDEX ix_contacts_organization_id ON contacts (organization_id);
CREATE TABLE deals (
	id INTEGER NOT NULL,
	name VARCHAR NOT NULL,
	organization_id INTEGER,
	contact_id INTEGER,
	stage VARCHAR NOT NULL,
	value INTEGER NOT NULL,
	probability INTEGER NOT NULL,
	close_date DATE NOT NULL,
	position INTEGER NOT NULL,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(organization_id) REFERENCES organizations (id),
	FOREIGN KEY(contact_id) REFERENCES contacts (id)
);
CREATE INDEX ix_deals_organization_id ON deals (organization_id);
CREATE INDEX ix_deals_contact_id ON deals (contact_id);
CREATE TABLE activities (
	id INTEGER NOT NULL,
	type VARCHAR NOT NULL,
	contact_id INTEGER,
	deal_id INTEGER,
	description TEXT NOT NULL,
	happened_at DATETIME NOT NULL,
	follow_up_date DATE,
	done BOOLEAN NOT NULL,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(contact_id) REFERENCES contacts (id),
	FOREIGN KEY(deal_id) REFERENCES deals (id)
);
CREATE INDEX ix_activities_contact_id ON activities (contact_id);
CREATE INDEX ix_activities_deal_id ON activities (deal_id);
