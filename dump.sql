--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_help_offers_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_help_offers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_help_offers_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: help_offers; Type: TABLE; Schema: public; Owner: postgres
--

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
    CONSTRAINT help_offers_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('accepted'::character varying)::text, ('declined'::character varying)::text, ('completed'::character varying)::text])))
);


ALTER TABLE public.help_offers OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

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
    CONSTRAINT posts_type_check CHECK (((type)::text = ANY (ARRAY[('request'::character varying)::text, ('offer'::character varying)::text])))
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: ratings; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.ratings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    postal_code character varying(10),
    profile_image_url character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reset_password_token text,
    reset_password_expires timestamp without time zone,
    google_id character varying(255),
    auth_provider character varying(20) DEFAULT 'email'::character varying,
    email_verified boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password_hash IS 'Kann NULL sein für OAuth User (Google, etc.)';


--
-- Name: COLUMN users.reset_password_token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.reset_password_token IS 'Token für Password Reset';


--
-- Name: COLUMN users.reset_password_expires; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.reset_password_expires IS 'Ablaufzeit für Password Reset Token';


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, is_active, created_at) FROM stdin;
1	Einkaufen	Hilfe beim Einkaufen und Besorgungen	t	2025-06-06 18:15:22.794425
2	Gartenarbeit	Unterstützung bei Garten- und Außenarbeiten	t	2025-06-06 18:15:22.794425
3	Handwerk	Kleine Reparaturen und handwerkliche Tätigkeiten	t	2025-06-06 18:15:22.794425
4	Kinderbetreuung	Betreuung und Unterstützung für Kinder	t	2025-06-06 18:15:22.794425
5	Seniorenbetreuung	Hilfe und Gesellschaft für ältere Menschen	t	2025-06-06 18:15:22.794425
6	Transport	Fahrdienste und Transportunterstützung	t	2025-06-06 18:15:22.794425
7	Haustiere	Betreuung und Versorgung von Haustieren	t	2025-06-06 18:15:22.794425
8	Sonstiges	Andere Hilfeleistungen	t	2025-06-06 18:15:22.794425
\.


--
-- Data for Name: help_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.help_offers (id, post_id, helper_id, post_owner_id, message, status, is_read, created_at, updated_at) FROM stdin;
07b3a023-719d-4c47-aced-e0be8abc0952	91026f98-1e17-4f7a-8fdb-c0b449ef0b8d	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	\N	accepted	t	2025-07-11 15:44:11.466292+00	2025-07-11 15:44:20.103491+00
ce705c90-9d95-42da-bf13-43966c66be54	e709a9c5-dd49-4d6d-a0a8-e60e756ee06e	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	\N	accepted	t	2025-07-11 16:01:10.607054+00	2025-07-11 16:01:39.303561+00
10c803e0-3e3f-4ab7-af6d-ee4728751b6b	6138dc3a-6cdf-4929-9d9a-546a3e29de65	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	\N	declined	t	2025-07-11 16:14:15.5488+00	2025-07-11 16:19:08.997676+00
5fc51e42-355d-4839-a825-34bff6a02732	c06d05bc-3401-4c37-8191-9ee5c6454536	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	\N	declined	t	2025-07-11 16:09:50.715648+00	2025-07-11 16:19:10.205507+00
88dbb4e9-358e-4f84-8efa-2423b05505d1	1eb1f3cf-5667-4ee8-a729-652477f9c198	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	\N	accepted	t	2025-07-11 16:18:50.91318+00	2025-07-11 16:19:13.978096+00
7ba96904-8b1e-42c1-9828-03b67aa13d9a	5ddee364-250d-4a16-8fe9-467478ec6a20	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	\N	accepted	t	2025-07-11 19:08:37.607956+00	2025-07-11 19:08:59.225266+00
117349be-f6e3-4546-b38b-a06210500f7a	48534660-6d69-451d-8483-a45ce454a8cd	37f651ca-1a77-485b-8351-04ed08c99c9c	51dade6d-22fd-4a05-92b0-74d13da67662	\N	accepted	t	2025-07-14 10:49:37.042095+00	2025-07-14 18:54:15.049646+00
c6ee72b9-97d5-4309-8cad-1fb528445f4f	c484ea01-c890-49f7-b1b9-65d7e11da14b	37f651ca-1a77-485b-8351-04ed08c99c9c	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-14 10:52:57.051544+00	2025-07-14 18:58:00.500604+00
36cdc611-4f0d-405b-af50-5637b1dfc32a	c484ea01-c890-49f7-b1b9-65d7e11da14b	51dade6d-22fd-4a05-92b0-74d13da67662	dfb66511-f9d1-4b8b-a540-5cb6c700331c	Ich bin interessiert an Ihrem Hilfe-Angebot!	accepted	t	2025-07-13 23:03:56.298173+00	2025-07-14 18:58:00.518335+00
3ab231d9-7d9a-496d-8f59-eb57627fdecd	ba019419-45e0-4785-88cf-cdf778689835	37f651ca-1a77-485b-8351-04ed08c99c9c	4cb68c89-2950-421f-ac6d-61c0c0237e77	\N	accepted	t	2025-07-14 10:48:46.135269+00	2025-07-14 21:15:16.360546+00
8b2e4faf-fc77-48f8-9f46-fab82560d59a	ba019419-45e0-4785-88cf-cdf778689835	51dade6d-22fd-4a05-92b0-74d13da67662	4cb68c89-2950-421f-ac6d-61c0c0237e77	\N	accepted	t	2025-07-14 20:19:01.099217+00	2025-07-14 22:01:25.757174+00
df755f43-2de9-4e40-83fe-c0c3bd2adb5b	8afeead6-ea3d-460a-a1fd-69d3f3c851a1	51dade6d-22fd-4a05-92b0-74d13da67662	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-16 08:24:21.352426+00	2025-07-16 08:24:34.911984+00
1dae56af-3b4b-463e-8737-6512a3451b90	d1a9b095-add2-491b-acbb-793487e26f2e	51dade6d-22fd-4a05-92b0-74d13da67662	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-16 08:35:57.557103+00	2025-07-16 08:36:08.284125+00
998b0d64-4e5b-45ae-8395-33b056b1474a	78f39ef3-02d6-48be-b7c8-e91b0a0b479a	4cb68c89-2950-421f-ac6d-61c0c0237e77	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-16 14:04:51.673877+00	2025-07-16 14:05:35.717061+00
ac5a8c16-76f4-40da-b7bc-1faa0ef7df51	b985f1c3-2643-4f72-89d4-6a23963089ef	4cb68c89-2950-421f-ac6d-61c0c0237e77	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-16 16:35:56.260027+00	2025-07-16 16:36:25.958334+00
31b8f965-0311-4e86-a707-eac1337771cc	6d082211-c8f5-43b9-9358-10f121402562	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-16 19:46:03.694292+00	2025-07-16 19:46:09.683884+00
24b2b18e-beaf-4ff5-b361-c0933afee21e	eea703af-fd7e-46c5-841a-cace30950fe6	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-16 20:02:26.652168+00	2025-07-16 20:02:46.724425+00
6f1976d4-1419-4b36-ae5f-1e91b3076fea	7921c8e9-13d7-4c70-aede-46fb00a2427a	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-16 20:13:25.445977+00	2025-07-16 20:13:35.661563+00
548c61f2-757a-4de1-b518-220eeb0c16da	1ac746f5-fa07-4810-855c-53d1840e5ddd	4cb68c89-2950-421f-ac6d-61c0c0237e77	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-16 22:06:45.791911+00	2025-07-16 22:11:45.194215+00
cf2639a7-8e18-4ca2-9f18-cbda63fd07f9	1ac746f5-fa07-4810-855c-53d1840e5ddd	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	accepted	t	2025-07-16 20:54:17.151618+00	2025-07-16 22:12:29.811167+00
142889b0-bf48-422e-8197-2b26da15e59b	6c026897-572e-45ad-a5d6-36d9848cad9c	dfb66511-f9d1-4b8b-a540-5cb6c700331c	4cb68c89-2950-421f-ac6d-61c0c0237e77	\N	accepted	t	2025-07-17 07:49:05.221486+00	2025-07-17 07:49:48.040769+00
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, sender_id, receiver_id, post_id, subject, content, is_read, created_at) FROM stdin;
badc8343-b1d0-47d6-a4d9-68cafdb3fdd0	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	\N	Chat über Post	hallo	t	2025-07-16 08:24:43.441384
a147a522-7a35-4014-9df5-94167b7b6de0	dfb66511-f9d1-4b8b-a540-5cb6c700331c	37f651ca-1a77-485b-8351-04ed08c99c9c	\N	Chat über Post	hallo	t	2025-07-14 13:05:15.529224
9070b59c-d05b-4300-b49f-abfd5631a215	51dade6d-22fd-4a05-92b0-74d13da67662	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	Chat über Post	hallo	t	2025-07-16 08:24:57.817239
08a5e02a-67b9-4178-84b4-edfe03f049b1	dfb66511-f9d1-4b8b-a540-5cb6c700331c	4cb68c89-2950-421f-ac6d-61c0c0237e77	\N	Chat über Post	hallo	t	2025-07-16 16:36:27.769986
4235f327-1a97-4d69-a43f-98120b6c588e	dfb66511-f9d1-4b8b-a540-5cb6c700331c	4cb68c89-2950-421f-ac6d-61c0c0237e77	\N	Chat über Post	Hallo	t	2025-07-16 18:21:08.094265
feb98a6d-eb9e-46ca-8a0d-2a1bd1ef5537	4cb68c89-2950-421f-ac6d-61c0c0237e77	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	Chat über Post	hallo	t	2025-07-17 07:50:01.459041
16aa1c7f-c2f5-46a5-aeeb-5831a77fc2e1	dfb66511-f9d1-4b8b-a540-5cb6c700331c	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	\N	Chat über Post	hallo	t	2025-07-16 20:02:56.043604
5f322636-5e3b-4f54-a883-8de49f8f1820	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	\N	Chat über Post	hallo	t	2025-07-16 08:36:17.450992
a861802f-2ade-495a-b033-b160dc838499	4cb68c89-2950-421f-ac6d-61c0c0237e77	dfb66511-f9d1-4b8b-a540-5cb6c700331c	\N	Chat über Post	hallo	t	2025-07-16 17:57:37.451736
5b4684a8-609d-4596-86d8-34adc0438c82	dfb66511-f9d1-4b8b-a540-5cb6c700331c	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	\N	Chat über Post	hallo	t	2025-07-16 19:46:17.110733
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, user_id, type, category, title, description, location, postal_code, is_active, created_at, updated_at, status, auto_close_date) FROM stdin;
5118d905-2c79-45cf-a39b-469e58312d8e	51dade6d-22fd-4a05-92b0-74d13da67662	request	Handwerk	qwe	qewq	12314	12345	f	2025-07-11 12:57:29.660007	2025-07-11 15:43:28.079135	closed	2025-07-14 12:57:29.660007
91026f98-1e17-4f7a-8fdb-c0b449ef0b8d	51dade6d-22fd-4a05-92b0-74d13da67662	request	Einkaufen	test	test	12345	12345	f	2025-07-11 15:43:46.762873	2025-07-11 16:09:23.153191	closed	2025-07-14 15:43:46.762873
e709a9c5-dd49-4d6d-a0a8-e60e756ee06e	51dade6d-22fd-4a05-92b0-74d13da67662	request	Einkaufen	test2	test2	12334	12345	f	2025-07-11 16:00:54.694572	2025-07-11 16:09:24.93099	closed	2025-07-14 16:00:54.694572
c06d05bc-3401-4c37-8191-9ee5c6454536	51dade6d-22fd-4a05-92b0-74d13da67662	request	Haustiere	test	test	12345	12345	f	2025-07-11 16:09:43.480486	2025-07-11 16:13:48.010262	closed	2025-07-14 16:09:43.480486
6138dc3a-6cdf-4929-9d9a-546a3e29de65	51dade6d-22fd-4a05-92b0-74d13da67662	request	Handwerk	test	test	12345	12345	f	2025-07-11 16:14:05.43298	2025-07-11 16:18:28.483598	closed	2025-07-14 16:14:05.43298
1eb1f3cf-5667-4ee8-a729-652477f9c198	51dade6d-22fd-4a05-92b0-74d13da67662	request	Handwerk	test	test	12345	12345	f	2025-07-11 16:18:44.005218	2025-07-11 16:28:57.549988	closed	2025-07-14 16:18:44.005218
5ddee364-250d-4a16-8fe9-467478ec6a20	51dade6d-22fd-4a05-92b0-74d13da67662	request	Gartenarbeit	test	test	12345	12345	f	2025-07-11 16:29:11.141551	2025-07-12 14:45:14.018674	closed	2025-07-14 16:29:11.141551
a69d897c-4d01-4e0b-b5d2-c76753482e46	51dade6d-22fd-4a05-92b0-74d13da67662	request	Gartenarbeit	test	test	12345	12345	f	2025-07-12 14:45:26.993154	2025-07-12 15:19:22.353564	closed	2025-07-15 14:45:26.993154
52288975-7c07-46ff-bd93-325ef22f7fab	51dade6d-22fd-4a05-92b0-74d13da67662	request	Handwerk	test	test	12345	12345	f	2025-07-11 22:52:05.688989	2025-07-14 00:35:35.947787	closed	2025-07-14 22:52:05.688989
48534660-6d69-451d-8483-a45ce454a8cd	51dade6d-22fd-4a05-92b0-74d13da67662	request	Gartenarbeit	bewertung	bewertung	12345	12345	f	2025-07-14 08:04:19.759212	2025-07-14 18:35:50.155944	closed	2025-07-17 08:04:19.759212
91951457-9ef4-4411-ab82-4fd416ea3251	51dade6d-22fd-4a05-92b0-74d13da67662	request	Einkaufen	einkaufen	einkaufen	istannbul	12345	f	2025-07-15 21:32:42.199697	2025-07-16 08:21:45.059236	closed	2025-07-18 21:32:42.199697
5f4ca643-9faf-4989-b159-74841c33613c	51dade6d-22fd-4a05-92b0-74d13da67662	request	Gartenarbeit	test	test	12345	12345	f	2025-07-15 22:01:17.79591	2025-07-16 08:21:46.777912	closed	2025-07-18 22:01:17.79591
c484ea01-c890-49f7-b1b9-65d7e11da14b	dfb66511-f9d1-4b8b-a540-5cb6c700331c	offer	Handwerk	ich brauche hilfe	ich brauche hilfe	12345	12345	f	2025-07-13 22:10:51.636957	2025-07-16 08:23:31.144005	closed	2025-07-16 22:10:51.636957
8afeead6-ea3d-460a-a1fd-69d3f3c851a1	dfb66511-f9d1-4b8b-a540-5cb6c700331c	request	Einkaufen	12345	12345	12345	12345	f	2025-07-16 08:23:48.602668	2025-07-16 08:35:03.37941	closed	2025-07-19 08:23:48.602668
6ed91720-fe5e-43d6-ba14-bafe937c5106	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	request	Einkaufen	tes456	test456	12345	12345	f	2025-07-16 13:11:14.381124	2025-07-16 13:51:56.218727	closed	2025-07-19 13:11:14.381124
d1a9b095-add2-491b-acbb-793487e26f2e	dfb66511-f9d1-4b8b-a540-5cb6c700331c	request	Einkaufen	qwerr	qweqrt	12345	12345	f	2025-07-16 08:35:21.47582	2025-07-16 14:04:12.382458	closed	2025-07-19 08:35:21.47582
78f39ef3-02d6-48be-b7c8-e91b0a0b479a	dfb66511-f9d1-4b8b-a540-5cb6c700331c	request	Einkaufen	test123	test123	Nicht angegeben	12345	f	2025-07-16 14:04:24.162746	2025-07-16 14:08:21.52633	closed	2025-07-19 14:04:24.162746
ba019419-45e0-4785-88cf-cdf778689835	4cb68c89-2950-421f-ac6d-61c0c0237e77	request	Einkaufen	bewertung	bewertung	12345	12345	f	2025-07-14 08:05:24.771377	2025-07-16 14:48:48.771393	closed	2025-07-17 08:05:24.771377
b985f1c3-2643-4f72-89d4-6a23963089ef	dfb66511-f9d1-4b8b-a540-5cb6c700331c	request	Einkaufen	test	test	Nicht angegeben	12345	f	2025-07-16 16:33:32.608732	2025-07-16 19:45:20.712689	closed	2025-07-19 16:33:32.608732
6c026897-572e-45ad-a5d6-36d9848cad9c	4cb68c89-2950-421f-ac6d-61c0c0237e77	request	Gartenarbeit	test	test	Nicht angegeben	12345	t	2025-07-16 22:08:10.454597	2025-07-17 07:49:48.055017	in_progress	2025-07-19 22:08:10.454597
1ac746f5-fa07-4810-855c-53d1840e5ddd	dfb66511-f9d1-4b8b-a540-5cb6c700331c	request	Gartenarbeit	test	test	Nicht angegeben	12345	f	2025-07-16 20:54:05.929913	2025-07-17 09:19:51.184406	closed	2025-07-19 20:54:05.929913
6d082211-c8f5-43b9-9358-10f121402562	dfb66511-f9d1-4b8b-a540-5cb6c700331c	request	Gartenarbeit	in bearbeitung	in berbeitung	Nicht angegeben	12345	f	2025-07-16 19:45:45.371234	2025-07-16 20:07:37.890571	closed	2025-07-19 19:45:45.371234
eea703af-fd7e-46c5-841a-cace30950fe6	dfb66511-f9d1-4b8b-a540-5cb6c700331c	request	Einkaufen	teste	teste	Nicht angegeben	12345	f	2025-07-16 20:02:10.433084	2025-07-16 20:07:40.201235	closed	2025-07-19 20:02:10.433084
7921c8e9-13d7-4c70-aede-46fb00a2427a	dfb66511-f9d1-4b8b-a540-5cb6c700331c	request	Einkaufen	test	test	Nicht angegeben	12345	f	2025-07-16 20:13:20.244708	2025-07-16 20:14:49.715105	closed	2025-07-19 20:13:20.244708
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ratings (id, rater_id, rated_user_id, post_id, rating, comment, created_at, updated_at) FROM stdin;
0d558d20-edf5-46f2-99ab-42c8bb2969bc	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	91026f98-1e17-4f7a-8fdb-c0b449ef0b8d	4	\N	2025-07-11 15:56:09.557345	2025-07-11 15:56:09.557345
f15a4bcb-200a-48b8-82a5-5ddf44b8a0aa	51dade6d-22fd-4a05-92b0-74d13da67662	dfb66511-f9d1-4b8b-a540-5cb6c700331c	91026f98-1e17-4f7a-8fdb-c0b449ef0b8d	4	\N	2025-07-11 15:56:18.281307	2025-07-11 15:56:18.281307
152b2266-66d1-487f-b707-ba1ea390be0f	51dade6d-22fd-4a05-92b0-74d13da67662	dfb66511-f9d1-4b8b-a540-5cb6c700331c	e709a9c5-dd49-4d6d-a0a8-e60e756ee06e	3	\N	2025-07-11 16:02:32.102985	2025-07-11 16:02:32.102985
1db8f0b1-4fff-4776-89a7-8a0a9f4d05ba	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	e709a9c5-dd49-4d6d-a0a8-e60e756ee06e	3	\N	2025-07-11 16:02:48.23866	2025-07-11 16:02:48.23866
d8355164-1e00-4168-8987-fb31186d477a	51dade6d-22fd-4a05-92b0-74d13da67662	dfb66511-f9d1-4b8b-a540-5cb6c700331c	1eb1f3cf-5667-4ee8-a729-652477f9c198	5	\N	2025-07-11 16:26:51.314781	2025-07-11 16:26:51.314781
c6493d2b-1ddd-4446-a088-45660b80998b	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	1eb1f3cf-5667-4ee8-a729-652477f9c198	5	\N	2025-07-11 16:26:57.883024	2025-07-11 16:26:57.883024
49b54ff1-0447-4db2-bd57-ae126ab4fa42	51dade6d-22fd-4a05-92b0-74d13da67662	dfb66511-f9d1-4b8b-a540-5cb6c700331c	d1a9b095-add2-491b-acbb-793487e26f2e	4	\N	2025-07-16 08:47:47.993462	2025-07-16 08:47:47.993462
448b492b-bcc2-4363-9204-43470608c7d9	dfb66511-f9d1-4b8b-a540-5cb6c700331c	51dade6d-22fd-4a05-92b0-74d13da67662	d1a9b095-add2-491b-acbb-793487e26f2e	3	\N	2025-07-16 08:50:01.380279	2025-07-16 08:50:01.380279
31d6a7c5-8f63-40fc-9ede-9e7b81921af7	51dade6d-22fd-4a05-92b0-74d13da67662	4cb68c89-2950-421f-ac6d-61c0c0237e77	ba019419-45e0-4785-88cf-cdf778689835	3	\N	2025-07-16 08:57:41.843159	2025-07-16 08:57:41.843159
40328157-500c-49ee-ad8b-7b2cb101a0f3	4cb68c89-2950-421f-ac6d-61c0c0237e77	dfb66511-f9d1-4b8b-a540-5cb6c700331c	78f39ef3-02d6-48be-b7c8-e91b0a0b479a	3	\N	2025-07-16 14:06:42.212039	2025-07-16 14:06:42.212039
89332df5-5073-44fb-b89b-3e15c1e537dd	dfb66511-f9d1-4b8b-a540-5cb6c700331c	4cb68c89-2950-421f-ac6d-61c0c0237e77	78f39ef3-02d6-48be-b7c8-e91b0a0b479a	3	ffdasfasdf	2025-07-16 14:08:13.917877	2025-07-16 14:08:13.917877
37e5b908-31d8-41fd-9baf-077b2f6289ec	dfb66511-f9d1-4b8b-a540-5cb6c700331c	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	6d082211-c8f5-43b9-9358-10f121402562	3	\N	2025-07-16 20:01:34.287865	2025-07-16 20:01:34.287865
25eef6bb-a749-496a-b6df-75e18bdd2084	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	dfb66511-f9d1-4b8b-a540-5cb6c700331c	6d082211-c8f5-43b9-9358-10f121402562	3	\N	2025-07-16 20:01:41.790138	2025-07-16 20:01:41.790138
e81c2837-271a-431c-8233-87f44b1e7792	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	dfb66511-f9d1-4b8b-a540-5cb6c700331c	eea703af-fd7e-46c5-841a-cace30950fe6	4	\N	2025-07-16 20:03:31.576142	2025-07-16 20:03:31.576142
568edf97-d0c9-4c50-8efc-fc1cab71a136	dfb66511-f9d1-4b8b-a540-5cb6c700331c	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	eea703af-fd7e-46c5-841a-cace30950fe6	3	\N	2025-07-16 20:03:47.546628	2025-07-16 20:03:47.546628
474aef98-3cc7-4d32-95aa-1d70f66be128	dfb66511-f9d1-4b8b-a540-5cb6c700331c	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	7921c8e9-13d7-4c70-aede-46fb00a2427a	5	\N	2025-07-16 20:14:02.008386	2025-07-16 20:14:02.008386
29c4d106-7171-47d1-92bf-1994e1203da9	e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	dfb66511-f9d1-4b8b-a540-5cb6c700331c	7921c8e9-13d7-4c70-aede-46fb00a2427a	5	\N	2025-07-16 20:14:19.938453	2025-07-16 20:14:19.938453
fea49e36-18ef-4330-8ef7-98472dfae2f1	dfb66511-f9d1-4b8b-a540-5cb6c700331c	4cb68c89-2950-421f-ac6d-61c0c0237e77	1ac746f5-fa07-4810-855c-53d1840e5ddd	4	\N	2025-07-17 09:18:56.683726	2025-07-17 09:18:56.683726
b6c9ad61-60c1-4a00-8560-02568ef5589b	4cb68c89-2950-421f-ac6d-61c0c0237e77	dfb66511-f9d1-4b8b-a540-5cb6c700331c	1ac746f5-fa07-4810-855c-53d1840e5ddd	4	\N	2025-07-17 09:19:19.328199	2025-07-17 09:19:19.328199
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, first_name, last_name, postal_code, profile_image_url, created_at, updated_at, reset_password_token, reset_password_expires, google_id, auth_provider, email_verified) FROM stdin;
213f0be7-3720-4602-b07c-c46e0808a3b4	test@test.de	123456	test	boi	12345	\N	2025-06-06 18:15:36.489314	2025-06-06 18:15:36.489314	\N	\N	\N	email	f
9b5220cc-8c6d-42c7-accf-aa962212a652	handy@test.de	123456	han	dy	12345	\N	2025-06-06 18:15:36.489314	2025-06-06 18:15:36.489314	\N	\N	\N	email	f
3c7647b7-9b45-4167-ae1d-fbb341324449	helper@test.de	$2b$10$ireWEICCFHny1biBHvXOcubV8OABy09FSXPs4dg/onEJbdpjHF/Py	Test	Helper	12345	\N	2025-06-11 16:48:32.108513	2025-06-11 16:48:32.108513	\N	\N	\N	email	f
37f651ca-1a77-485b-8351-04ed08c99c9c	tugba.akguel@gmx.de	$2b$10$sh3tk/z9xIWyj/0zWbN8uOWh5WwH9w7T/EuaTjaph55a2Yftkop3e	Tu	Ak	12345	\N	2025-06-11 17:23:05.23223	2025-06-11 17:23:05.23223	\N	\N	\N	email	f
94dbe780-1dc5-4512-bc47-8ee3d8f04fc6	hafsaakguel@gmail.com	$2b$10$T7.WoF9PU7KJqx0Q8C1ZmOVmGs4wlHFQKLOJN7St1UaUQI42Nv8e.	Ha	akk	12345	\N	2025-06-11 19:29:30.13398	2025-06-11 19:29:30.13398	\N	\N	\N	email	f
df1fee6c-5cad-408e-8885-3849259a5dc5	afra.akguel@gmail.com	$2b$10$O6ZHTIqd0FhVE1tdqYflje.LxwnRGvyZiTpnX3PGg1nLWkJuZxLWq	Af	ak	12345	\N	2025-06-11 20:14:44.824218	2025-06-11 20:14:44.824218	\N	\N	\N	email	f
614c9c96-d702-4c59-adc9-f7f51e67c5de	yacey@hotmail.de	$2b$10$5EcbqaFMdJz9ziXItA0KAuiBjmCLdLjkiNazAPMSi8KnEN5KmIjwW	Nimesay	Ceylan	12345	\N	2025-06-13 09:42:28.900805	2025-06-13 09:42:28.900805	\N	\N	\N	email	f
f1595428-310f-4149-a02b-8b7eee4ab19c	jane.doe@gmx.de	$2b$10$CdLW9rLCIhO/QT68ixf4fuKC9hBuo6/40G183Hf217xni3CWVl1SK	Jane	Doe	12345	\N	2025-06-13 09:42:58.348491	2025-06-13 09:42:58.348491	\N	\N	\N	email	f
7e2f5e12-ccc5-4f1c-801f-e463a9a38b9b	testmail@test.de	$2b$10$esAUmYhJwLh9bj9bTGd.mOrGFz.CLL1VCbu4Rf3pi01Pss.X9qXv2	test	test	12345	\N	2025-06-13 11:02:45.436101	2025-06-13 11:02:45.436101	\N	\N	\N	email	f
6ba8bcd1-4720-4d24-a568-48ce6f830cca	/@test.de	$2b$10$SonF9ssmT1ac1JaLOfnJluobu0MCmnChCtDmD22qKHACIwTxej8bq	%	/	12345	\N	2025-06-13 11:04:28.706797	2025-06-13 11:04:28.706797	\N	\N	\N	email	f
5ba24a5d-1093-4a18-ae60-ea6017b59f7e	stephanie.pietschmann@tn.techstarter.de	$2b$10$MN1KHem3HNYZEZ1hlkAZ2eaQCPLWy.0roR/hkwjHbzlEzFNwtoORm	Stephi	Pietschmann	12345	\N	2025-07-09 12:14:09.077961	2025-07-09 12:14:09.077961	\N	\N	\N	email	f
4cb68c89-2950-421f-ac6d-61c0c0237e77	norply.neighborly@gmail.com	\N	neigh	borly	12345	https://lh3.googleusercontent.com/a/ACg8ocKiVCRiMY7mrGTyKjDZZp6R5Wnp3qxij7ATuFHyTByMkqK7LQ=s96-c	2025-07-14 07:19:24.419985	2025-07-16 10:16:43.030958	\N	\N	112478188637182035448	google	f
e0524dcb-8b8c-4194-8d01-b5cd1594f3ec	omer77akgull@gmail.com	\N	Omer	Akgull	12345	\N	2025-07-16 13:09:21.445416	2025-07-16 13:09:40.911511	\N	\N	104901456947837267853	google	t
dfb66511-f9d1-4b8b-a540-5cb6c700331c	demo@test.de	$2b$10$6q1WT/mbOGy5XXu0uKuqEeeyBZdrWoh3uH.ihq7.WEMfJRjfid2ie	Demo	User	12345	\N	2025-06-06 18:15:36.489314	2025-06-06 18:15:36.489314	7a58ed32f92d4424977e378ad7ab2d39f3842d254a8e62622442667a4a8e78e5	2025-07-17 00:07:04.228	\N	email	f
51dade6d-22fd-4a05-92b0-74d13da67662	limon.ramon33@gmail.com	$2b$10$1deLFEN9Le6QQmDfKlJogO.jae/QCnum7LthvynyBizyKdjBhAEhi	ömer	Akgül	12345	\N	2025-06-06 18:15:36.489314	2025-07-16 21:39:26.845625	\N	\N	102366198933939385873	google	f
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: help_offers help_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_pkey PRIMARY KEY (id);


--
-- Name: help_offers help_offers_post_id_helper_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_post_id_helper_id_key UNIQUE (post_id, helper_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_rater_id_rated_user_id_post_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_rater_id_rated_user_id_post_id_key UNIQUE (rater_id, rated_user_id, post_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_help_offers_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_help_offers_created_at ON public.help_offers USING btree (created_at);


--
-- Name: idx_help_offers_helper_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_help_offers_helper_id ON public.help_offers USING btree (helper_id);


--
-- Name: idx_help_offers_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_help_offers_is_read ON public.help_offers USING btree (is_read);


--
-- Name: idx_help_offers_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_help_offers_post_id ON public.help_offers USING btree (post_id);


--
-- Name: idx_help_offers_post_owner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_help_offers_post_owner_id ON public.help_offers USING btree (post_owner_id);


--
-- Name: idx_help_offers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_help_offers_status ON public.help_offers USING btree (status);


--
-- Name: idx_users_auth_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_auth_provider ON public.users USING btree (auth_provider);


--
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- Name: idx_users_reset_password_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_reset_password_token ON public.users USING btree (reset_password_token);


--
-- Name: help_offers update_help_offers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_help_offers_updated_at BEFORE UPDATE ON public.help_offers FOR EACH ROW EXECUTE FUNCTION public.update_help_offers_updated_at();


--
-- Name: help_offers help_offers_helper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_helper_id_fkey FOREIGN KEY (helper_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: help_offers help_offers_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: help_offers help_offers_post_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.help_offers
    ADD CONSTRAINT help_offers_post_owner_id_fkey FOREIGN KEY (post_owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_rated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_rater_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_rater_id_fkey FOREIGN KEY (rater_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

