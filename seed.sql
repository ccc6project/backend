-- Users Table
CREATE TABLE "user" (
    user_id           SERIAL PRIMARY KEY,
    email             VARCHAR(100) NOT NULL UNIQUE,
    password          VARCHAR(100) NOT NULL,
    name              VARCHAR(100) NOT NULL,
    document_type     VARCHAR(20) NOT NULL,
    document_number   VARCHAR(30) NOT NULL
);

-- Banks Table
CREATE TABLE bank (
    bank_id         SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    bank_code       VARCHAR(10) UNIQUE NOT NULL,
    host            VARCHAR(100)
);

-- Bank Accounts Table
CREATE TABLE bank_account (
    account_id      SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES "user"(user_id),
    bank_id         INTEGER NOT NULL REFERENCES bank(bank_id),
    account_number  VARCHAR(20) NOT NULL,
    balance         NUMERIC(12,2) NOT NULL,
    account_type    VARCHAR(20) NOT NULL,
    UNIQUE(bank_id, account_number)
);

-- Credit Cards Table
CREATE TABLE credit_card (
    card_number         CHAR(16) PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES "user"(user_id),
    bank_id             INTEGER NOT NULL REFERENCES bank(bank_id),
    cardholder_name     VARCHAR(100) NOT NULL,
    expiration_date     CHAR(6) NOT NULL,
    security_code       CHAR(3) NOT NULL,
    credit_limit        NUMERIC(12,2) NOT NULL,
    available_credit    NUMERIC(12,2) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
);

-- Card Authorizations Table
CREATE TABLE card_authorization (
    authorization_id        SERIAL PRIMARY KEY,
    card_number             CHAR(16) NOT NULL REFERENCES credit_card(card_number),
    timestamp               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount                  NUMERIC(12,2) NOT NULL,
    status                  VARCHAR(10) NOT NULL CHECK (status IN ('APPROVED', 'DENIED')),
    store                   VARCHAR(100),
    -- reference_transaction   INTEGER REFERENCES card_transaction(transaction_id),  -- REMOVE for now
    authorization_code      VARCHAR(20)
);

-- Card Transactions Table
CREATE TABLE card_transaction (
    transaction_id      SERIAL PRIMARY KEY,
    card_number         CHAR(16) NOT NULL REFERENCES credit_card(card_number),
    timestamp           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type                VARCHAR(10) NOT NULL CHECK (type IN ('PURCHASE', 'PAYMENT')),
    amount              NUMERIC(12,2) NOT NULL,
    description         VARCHAR(255),
    status              VARCHAR(10) NOT NULL CHECK (status IN ('APPROVED', 'DENIED')),
    source_account_id   INTEGER REFERENCES bank_account(account_id)
    -- authorization_id    INTEGER REFERENCES card_authorization(authorization_id)  -- REMOVE for now
);

ALTER TABLE card_transaction
    ADD COLUMN authorization_id INTEGER,
    ADD CONSTRAINT fk_transaction_authorization
        FOREIGN KEY (authorization_id)
        REFERENCES card_authorization(authorization_id);

ALTER TABLE card_authorization
    ADD COLUMN reference_transaction INTEGER,
    ADD CONSTRAINT fk_authorization_reference_transaction
        FOREIGN KEY (reference_transaction)
        REFERENCES card_transaction(transaction_id);
