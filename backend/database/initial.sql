-- PostgreSQL database initial schema

-- Funktion für Trigger
CREATE FUNCTION public.update_help_offers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Tabellen und Sequenzen
CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);

CREATE TABLE public.help_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    helper_id uuid NOT NULL,
    post_owner_id uuid NOT NULL,
    message text,
    status character varying(20) DEFAULT 'pending'::character varying,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT help_offers_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'completed'::character varying])::text[])))
);

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid,
    receiver_id uuid,
    post_id uuid,
    subject character varying(200),
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(20) NOT NULL,
    category character varying(100) NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    location character varying(200),
    postal_code character varying(10),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    auto_close_date timestamp without time zone,
    CONSTRAINT posts_type_check CHECK (((type)::text = ANY ((ARRAY['request'::character varying, 'offer'::character varying])::text[])))
);

CREATE TABLE public.ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rater_id uuid NOT NULL,
    rated_user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    postal_code character varying(10),
    profile_image_url character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Constraints
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_post_id_helper_id_key UNIQUE (post_id, helper_id);

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_rater_id_rated_user_id_post_id_key UNIQUE (rater_id, rated_user_id, post_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Indizes
CREATE INDEX idx_help_offers_created_at ON public.help_offers USING btree (created_at);
CREATE INDEX idx_help_offers_helper_id ON public.help_offers USING btree (helper_id);
CREATE INDEX idx_help_offers_is_read ON public.help_offers USING btree (is_read);
CREATE INDEX idx_help_offers_post_id ON public.help_offers USING btree (post_id);
CREATE INDEX idx_help_offers_post_owner_id ON public.help_offers USING btree (post_owner_id);
CREATE INDEX idx_help_offers_status ON public.help_offers USING btree (status);

-- Trigger
CREATE TRIGGER update_help_offers_updated_at BEFORE UPDATE ON public.help_offers FOR EACH ROW EXECUTE FUNCTION public.update_help_offers_updated_at();

-- Foreign Keys
ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_helper_id_fkey FOREIGN KEY (helper_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_post_owner_id_fkey FOREIGN KEY (post_owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_rater_id_fkey FOREIGN KEY (rater_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Standard-Kategorien einfügen
INSERT INTO public.categories (name, description, is_active)
VALUES
  ('Einkaufen', 'Hilfe beim Einkaufen und Besorgungen', true),
  ('Gartenarbeit', 'Unterstützung bei Garten- und Außenarbeiten', true),
  ('Handwerk', 'Kleine Reparaturen und handwerkliche Tätigkeiten', true),
  ('Kinderbetreuung', 'Betreuung und Unterstützung für Kinder', true),
  ('Seniorenbetreuung', 'Hilfe und Gesellschaft für ältere Menschen', true),
  ('Transport', 'Fahrdienste und Transportunterstützung', true),
  ('Haustiere', 'Betreuung und Versorgung von Haustieren', true),
  ('Sonstiges', 'Andere Hilfeleistungen', true);