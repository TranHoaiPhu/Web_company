--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: banner_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.banner_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SCHEDULED'
);


ALTER TYPE public.banner_status OWNER TO postgres;

--
-- Name: difficulty_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.difficulty_level AS ENUM (
    'EASY',
    'MODERATE',
    'CHALLENGING',
    'DIFFICULT'
);


ALTER TYPE public.difficulty_level OWNER TO postgres;

--
-- Name: discount_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.discount_type AS ENUM (
    'PERCENTAGE',
    'FIXED_AMOUNT'
);


ALTER TYPE public.discount_type OWNER TO postgres;

--
-- Name: location_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.location_type AS ENUM (
    'REGION',
    'CITY',
    'COUNTRY'
);


ALTER TYPE public.location_type OWNER TO postgres;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'ORDER',
    'PAYMENT',
    'TOUR',
    'REVIEW',
    'PROMOTION',
    'SYSTEM'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PAID',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'MOMO',
    'VNPAY',
    'ZALOPAY',
    'BANK_TRANSFER',
    'CASH',
    'CARD'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'UNPAID',
    'PAID',
    'PARTIAL',
    'REFUNDED'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: place_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.place_type AS ENUM (
    'HOTEL',
    'RESTAURANT',
    'ATTRACTION',
    'BEACH',
    'TEMPLE',
    'MUSEUM',
    'PARK',
    'OTHER'
);


ALTER TYPE public.place_type OWNER TO postgres;

--
-- Name: schedule_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.schedule_status AS ENUM (
    'OPEN',
    'FULL',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public.schedule_status OWNER TO postgres;

--
-- Name: tour_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tour_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DRAFT'
);


ALTER TYPE public.tour_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'CUSTOMER',
    'ADMIN'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'ACTIVE',
    'BLOCKED'
);


ALTER TYPE public.user_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amenities (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    icon character varying(100),
    category character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.amenities OWNER TO postgres;

--
-- Name: amenities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.amenities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.amenities_id_seq OWNER TO postgres;

--
-- Name: amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.amenities_id_seq OWNED BY public.amenities.id;


--
-- Name: banner_slides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banner_slides (
    id bigint NOT NULL,
    title character varying(255) NOT NULL,
    subtitle text,
    description text,
    image_url text NOT NULL,
    mobile_image_url text,
    alt_text character varying(255),
    location character varying(255),
    tag character varying(100),
    link_url character varying(500),
    link_text character varying(100),
    tour_id bigint,
    display_order integer DEFAULT 0,
    status public.banner_status DEFAULT 'ACTIVE'::public.banner_status,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    view_count integer DEFAULT 0,
    click_count integer DEFAULT 0,
    background_color character varying(7),
    text_color character varying(7),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.banner_slides OWNER TO postgres;

--
-- Name: TABLE banner_slides; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.banner_slides IS 'Bảng lưu trữ banner slides cho trang chủ';


--
-- Name: COLUMN banner_slides.mobile_image_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.banner_slides.mobile_image_url IS 'Ảnh riêng cho mobile (nếu có)';


--
-- Name: COLUMN banner_slides.link_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.banner_slides.link_url IS 'URL khi click vào banner';


--
-- Name: COLUMN banner_slides.tour_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.banner_slides.tour_id IS 'ID tour liên kết (nếu có)';


--
-- Name: COLUMN banner_slides.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.banner_slides.status IS 'Trạng thái: ACTIVE, INACTIVE, SCHEDULED';


--
-- Name: COLUMN banner_slides.start_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.banner_slides.start_date IS 'Ngày bắt đầu hiển thị (cho banner scheduled)';


--
-- Name: COLUMN banner_slides.end_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.banner_slides.end_date IS 'Ngày kết thúc hiển thị';


--
-- Name: banner_slides_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.banner_slides_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.banner_slides_id_seq OWNER TO postgres;

--
-- Name: banner_slides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.banner_slides_id_seq OWNED BY public.banner_slides.id;


--
-- Name: day_places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.day_places (
    id bigint NOT NULL,
    tour_day_id bigint,
    place_id bigint,
    visit_order integer DEFAULT 0,
    duration_minutes integer,
    notes text
);


ALTER TABLE public.day_places OWNER TO postgres;

--
-- Name: day_places_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.day_places_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.day_places_id_seq OWNER TO postgres;

--
-- Name: day_places_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.day_places_id_seq OWNED BY public.day_places.id;


--
-- Name: discount_code_usages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discount_code_usages (
    id bigint NOT NULL,
    discount_code_id bigint,
    order_id bigint,
    discount_amount numeric(12,2) NOT NULL,
    used_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid
);


ALTER TABLE public.discount_code_usages OWNER TO postgres;

--
-- Name: discount_code_usages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.discount_code_usages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discount_code_usages_id_seq OWNER TO postgres;

--
-- Name: discount_code_usages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discount_code_usages_id_seq OWNED BY public.discount_code_usages.id;


--
-- Name: discount_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discount_codes (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    discount_type public.discount_type NOT NULL,
    discount_value numeric(12,2) NOT NULL,
    max_discount_amount numeric(12,2),
    min_order_amount numeric(12,2) DEFAULT 0,
    max_uses integer,
    max_uses_per_user integer DEFAULT 1,
    used_count integer DEFAULT 0,
    valid_from timestamp without time zone NOT NULL,
    valid_to timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    is_public boolean DEFAULT true,
    applicable_tour_ids bigint[],
    applicable_category_ids bigint[],
    created_by bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.discount_codes OWNER TO postgres;

--
-- Name: TABLE discount_codes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.discount_codes IS 'Bảng lưu trữ mã ưu đãi/giảm giá';


--
-- Name: COLUMN discount_codes.code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.discount_codes.code IS 'Mã ưu đãi (unique)';


--
-- Name: COLUMN discount_codes.discount_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.discount_codes.discount_type IS 'Loại giảm giá: PERCENTAGE hoặc FIXED_AMOUNT';


--
-- Name: COLUMN discount_codes.discount_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.discount_codes.discount_value IS 'Giá trị giảm (% hoặc số tiền cố định)';


--
-- Name: COLUMN discount_codes.max_discount_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.discount_codes.max_discount_amount IS 'Số tiền giảm tối đa (áp dụng cho PERCENTAGE)';


--
-- Name: COLUMN discount_codes.min_order_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.discount_codes.min_order_amount IS 'Giá trị đơn hàng tối thiểu để áp dụng mã';


--
-- Name: COLUMN discount_codes.max_uses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.discount_codes.max_uses IS 'Số lần sử dụng tối đa (NULL = không giới hạn)';


--
-- Name: COLUMN discount_codes.max_uses_per_user; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.discount_codes.max_uses_per_user IS 'Số lần 1 user được sử dụng';


--
-- Name: COLUMN discount_codes.is_public; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.discount_codes.is_public IS 'Mã công khai hay mã private/VIP';


--
-- Name: COLUMN discount_codes.applicable_tour_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.discount_codes.applicable_tour_ids IS 'Mảng ID các tour được áp dụng (NULL = tất cả)';


--
-- Name: discount_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.discount_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discount_codes_id_seq OWNER TO postgres;

--
-- Name: discount_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discount_codes_id_seq OWNED BY public.discount_codes.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    type public.location_type NOT NULL,
    parent_id bigint,
    latitude numeric(10,6),
    longitude numeric(10,6),
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: order_amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_amenities (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    amenity_id bigint,
    amenity_name character varying(255) NOT NULL,
    quantity integer DEFAULT 1,
    price_at_booking numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL
);


ALTER TABLE public.order_amenities OWNER TO postgres;

--
-- Name: order_amenities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_amenities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_amenities_id_seq OWNER TO postgres;

--
-- Name: order_amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_amenities_id_seq OWNED BY public.order_amenities.id;


--
-- Name: order_coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_coupons (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    discount_code_id bigint NOT NULL,
    discount_amount numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_coupons OWNER TO postgres;

--
-- Name: order_coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_coupons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_coupons_id_seq OWNER TO postgres;

--
-- Name: order_coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_coupons_id_seq OWNED BY public.order_coupons.id;


--
-- Name: order_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_participants (
    id bigint NOT NULL,
    order_id bigint,
    full_name character varying(255) NOT NULL,
    participant_type character varying(20),
    gender character varying(10),
    date_of_birth date,
    id_number character varying(50),
    nationality character varying(100),
    phone character varying(20),
    email character varying(255),
    special_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT order_participants_participant_type_check CHECK (((participant_type)::text = ANY ((ARRAY['ADULT'::character varying, 'CHILD'::character varying, 'INFANT'::character varying])::text[])))
);


ALTER TABLE public.order_participants OWNER TO postgres;

--
-- Name: order_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_participants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_participants_id_seq OWNER TO postgres;

--
-- Name: order_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_participants_id_seq OWNED BY public.order_participants.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    order_code character varying(50) NOT NULL,
    tour_id bigint,
    schedule_id bigint,
    discount_code_id bigint,
    tour_name character varying(255),
    location_name character varying(255),
    start_date date,
    end_date date,
    price_at_booking numeric(12,2),
    adult_quantity integer DEFAULT 1,
    child_quantity integer DEFAULT 0,
    infant_quantity integer DEFAULT 0,
    total_participants integer,
    contact_name character varying(255),
    contact_phone character varying(20),
    contact_email character varying(255),
    special_requests text,
    subtotal numeric(12,2),
    discount_amount numeric(12,2) DEFAULT 0,
    total_price numeric(12,2),
    status public.order_status DEFAULT 'PENDING'::public.order_status,
    payment_status public.payment_status DEFAULT 'UNPAID'::public.payment_status,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    note text,
    user_id uuid,
    payment_method public.payment_method
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    payment_code character varying(50) NOT NULL,
    order_id bigint,
    payment_method public.payment_method,
    amount numeric(12,2),
    payment_status public.payment_status DEFAULT 'UNPAID'::public.payment_status,
    transaction_code character varying(255),
    gateway_response text,
    paid_at timestamp without time zone,
    refunded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    bankcode character(10)
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.places (
    id bigint NOT NULL,
    location_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    address text,
    latitude numeric(10,6),
    longitude numeric(10,6),
    image_url text,
    type public.place_type DEFAULT 'ATTRACTION'::public.place_type,
    rating numeric(3,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.places OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.places_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.places_id_seq OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.places_id_seq OWNED BY public.places.id;


--
-- Name: tour_amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tour_amenities (
    id bigint NOT NULL,
    tour_id bigint,
    amenity_id bigint,
    price numeric(12,2) DEFAULT 0,
    is_included boolean DEFAULT true,
    is_optional boolean DEFAULT false
);


ALTER TABLE public.tour_amenities OWNER TO postgres;

--
-- Name: tour_amenities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tour_amenities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tour_amenities_id_seq OWNER TO postgres;

--
-- Name: tour_amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tour_amenities_id_seq OWNED BY public.tour_amenities.id;


--
-- Name: tour_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tour_categories (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    icon character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tour_categories OWNER TO postgres;

--
-- Name: tour_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tour_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tour_categories_id_seq OWNER TO postgres;

--
-- Name: tour_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tour_categories_id_seq OWNED BY public.tour_categories.id;


--
-- Name: tour_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tour_days (
    id bigint NOT NULL,
    tour_id bigint,
    day_number integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    accommodation character varying(255),
    meals character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tour_days OWNER TO postgres;

--
-- Name: tour_days_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tour_days_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tour_days_id_seq OWNER TO postgres;

--
-- Name: tour_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tour_days_id_seq OWNED BY public.tour_days.id;


--
-- Name: tour_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tour_images (
    id bigint NOT NULL,
    tour_id bigint,
    image_url text NOT NULL,
    alt_text character varying(255),
    is_cover boolean DEFAULT false,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tour_images OWNER TO postgres;

--
-- Name: tour_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tour_images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tour_images_id_seq OWNER TO postgres;

--
-- Name: tour_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tour_images_id_seq OWNED BY public.tour_images.id;


--
-- Name: tour_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tour_schedules (
    id bigint NOT NULL,
    tour_id bigint,
    start_date date NOT NULL,
    end_date date NOT NULL,
    price_override numeric(12,2),
    available_slots integer NOT NULL,
    booked_slots integer DEFAULT 0,
    status public.schedule_status DEFAULT 'OPEN'::public.schedule_status,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_slots integer
);


ALTER TABLE public.tour_schedules OWNER TO postgres;

--
-- Name: tour_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tour_schedules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tour_schedules_id_seq OWNER TO postgres;

--
-- Name: tour_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tour_schedules_id_seq OWNED BY public.tour_schedules.id;


--
-- Name: tours; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tours (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    location_id bigint NOT NULL,
    category_id bigint,
    short_description text,
    description text,
    highlights text,
    included_services text,
    excluded_services text,
    terms_conditions text,
    cancellation_policy text,
    duration_days integer NOT NULL,
    duration_nights integer NOT NULL,
    base_price numeric(12,2) NOT NULL,
    child_price numeric(12,2),
    infant_price numeric(12,2),
    max_participants integer DEFAULT 20,
    min_participants integer DEFAULT 1,
    difficulty public.difficulty_level DEFAULT 'EASY'::public.difficulty_level,
    transportation_type character varying(100),
    departure_location character varying(255),
    return_location character varying(255),
    view_count integer DEFAULT 0,
    booking_count integer DEFAULT 0,
    rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    status public.tour_status DEFAULT 'DRAFT'::public.tour_status,
    is_featured boolean DEFAULT false,
    is_hot_deal boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tours OWNER TO postgres;

--
-- Name: tours_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tours_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tours_id_seq OWNER TO postgres;

--
-- Name: tours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tours_id_seq OWNED BY public.tours.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'CUSTOMER'::public.user_role,
    status public.user_status DEFAULT 'ACTIVE'::public.user_status,
    avatar_url text,
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: amenities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities ALTER COLUMN id SET DEFAULT nextval('public.amenities_id_seq'::regclass);


--
-- Name: banner_slides id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banner_slides ALTER COLUMN id SET DEFAULT nextval('public.banner_slides_id_seq'::regclass);


--
-- Name: day_places id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_places ALTER COLUMN id SET DEFAULT nextval('public.day_places_id_seq'::regclass);


--
-- Name: discount_code_usages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_code_usages ALTER COLUMN id SET DEFAULT nextval('public.discount_code_usages_id_seq'::regclass);


--
-- Name: discount_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes ALTER COLUMN id SET DEFAULT nextval('public.discount_codes_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: order_amenities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_amenities ALTER COLUMN id SET DEFAULT nextval('public.order_amenities_id_seq'::regclass);


--
-- Name: order_coupons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_coupons ALTER COLUMN id SET DEFAULT nextval('public.order_coupons_id_seq'::regclass);


--
-- Name: order_participants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_participants ALTER COLUMN id SET DEFAULT nextval('public.order_participants_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: places id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places ALTER COLUMN id SET DEFAULT nextval('public.places_id_seq'::regclass);


--
-- Name: tour_amenities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_amenities ALTER COLUMN id SET DEFAULT nextval('public.tour_amenities_id_seq'::regclass);


--
-- Name: tour_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_categories ALTER COLUMN id SET DEFAULT nextval('public.tour_categories_id_seq'::regclass);


--
-- Name: tour_days id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_days ALTER COLUMN id SET DEFAULT nextval('public.tour_days_id_seq'::regclass);


--
-- Name: tour_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_images ALTER COLUMN id SET DEFAULT nextval('public.tour_images_id_seq'::regclass);


--
-- Name: tour_schedules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_schedules ALTER COLUMN id SET DEFAULT nextval('public.tour_schedules_id_seq'::regclass);


--
-- Name: tours id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours ALTER COLUMN id SET DEFAULT nextval('public.tours_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: amenities amenities_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_name_key UNIQUE (name);


--
-- Name: amenities amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (id);


--
-- Name: amenities amenities_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_slug_key UNIQUE (slug);


--
-- Name: banner_slides banner_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banner_slides
    ADD CONSTRAINT banner_slides_pkey PRIMARY KEY (id);


--
-- Name: day_places day_places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_places
    ADD CONSTRAINT day_places_pkey PRIMARY KEY (id);


--
-- Name: discount_code_usages discount_code_usages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_code_usages
    ADD CONSTRAINT discount_code_usages_pkey PRIMARY KEY (id);


--
-- Name: discount_codes discount_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_code_key UNIQUE (code);


--
-- Name: discount_codes discount_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: locations locations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_slug_key UNIQUE (slug);


--
-- Name: order_amenities order_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_amenities
    ADD CONSTRAINT order_amenities_pkey PRIMARY KEY (id);


--
-- Name: order_coupons order_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_coupons
    ADD CONSTRAINT order_coupons_pkey PRIMARY KEY (id);


--
-- Name: order_participants order_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_participants
    ADD CONSTRAINT order_participants_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key UNIQUE (order_code);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_payment_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_code_key UNIQUE (payment_code);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: places places_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_slug_key UNIQUE (slug);


--
-- Name: tour_amenities tour_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_amenities
    ADD CONSTRAINT tour_amenities_pkey PRIMARY KEY (id);


--
-- Name: tour_amenities tour_amenities_tour_id_amenity_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_amenities
    ADD CONSTRAINT tour_amenities_tour_id_amenity_id_key UNIQUE (tour_id, amenity_id);


--
-- Name: tour_categories tour_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_categories
    ADD CONSTRAINT tour_categories_pkey PRIMARY KEY (id);


--
-- Name: tour_categories tour_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_categories
    ADD CONSTRAINT tour_categories_slug_key UNIQUE (slug);


--
-- Name: tour_days tour_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_days
    ADD CONSTRAINT tour_days_pkey PRIMARY KEY (id);


--
-- Name: tour_days tour_days_tour_id_day_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_days
    ADD CONSTRAINT tour_days_tour_id_day_number_key UNIQUE (tour_id, day_number);


--
-- Name: tour_images tour_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_images
    ADD CONSTRAINT tour_images_pkey PRIMARY KEY (id);


--
-- Name: tour_schedules tour_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_schedules
    ADD CONSTRAINT tour_schedules_pkey PRIMARY KEY (id);


--
-- Name: tours tours_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);


--
-- Name: tours tours_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_slug_key UNIQUE (slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uuid_unique UNIQUE (user_id);


--
-- Name: idx_banner_slides_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_banner_slides_dates ON public.banner_slides USING btree (start_date, end_date);


--
-- Name: idx_banner_slides_display_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_banner_slides_display_order ON public.banner_slides USING btree (display_order);


--
-- Name: idx_banner_slides_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_banner_slides_status ON public.banner_slides USING btree (status);


--
-- Name: idx_discount_codes_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discount_codes_active ON public.discount_codes USING btree (is_active);


--
-- Name: idx_discount_codes_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discount_codes_code ON public.discount_codes USING btree (code);


--
-- Name: idx_discount_codes_valid_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discount_codes_valid_dates ON public.discount_codes USING btree (valid_from, valid_to);


--
-- Name: idx_orders_discount_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_discount_code ON public.orders USING btree (discount_code_id);


--
-- Name: banner_slides banner_slides_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banner_slides
    ADD CONSTRAINT banner_slides_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id);


--
-- Name: day_places day_places_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_places
    ADD CONSTRAINT day_places_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id);


--
-- Name: day_places day_places_tour_day_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_places
    ADD CONSTRAINT day_places_tour_day_id_fkey FOREIGN KEY (tour_day_id) REFERENCES public.tour_days(id) ON DELETE CASCADE;


--
-- Name: discount_code_usages discount_code_usages_discount_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_code_usages
    ADD CONSTRAINT discount_code_usages_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id) ON DELETE CASCADE;


--
-- Name: discount_code_usages discount_code_usages_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_code_usages
    ADD CONSTRAINT discount_code_usages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: discount_codes discount_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: locations locations_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.locations(id);


--
-- Name: order_amenities order_amenities_amenity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_amenities
    ADD CONSTRAINT order_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id);


--
-- Name: order_amenities order_amenities_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_amenities
    ADD CONSTRAINT order_amenities_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_coupons order_coupons_discount_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_coupons
    ADD CONSTRAINT order_coupons_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id);


--
-- Name: order_coupons order_coupons_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_coupons
    ADD CONSTRAINT order_coupons_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_participants order_participants_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_participants
    ADD CONSTRAINT order_participants_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_discount_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id);


--
-- Name: orders orders_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.tour_schedules(id);


--
-- Name: orders orders_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: places places_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: tour_amenities tour_amenities_amenity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_amenities
    ADD CONSTRAINT tour_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id);


--
-- Name: tour_amenities tour_amenities_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_amenities
    ADD CONSTRAINT tour_amenities_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE CASCADE;


--
-- Name: tour_days tour_days_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_days
    ADD CONSTRAINT tour_days_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE CASCADE;


--
-- Name: tour_images tour_images_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_images
    ADD CONSTRAINT tour_images_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE CASCADE;


--
-- Name: tour_schedules tour_schedules_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_schedules
    ADD CONSTRAINT tour_schedules_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE CASCADE;


--
-- Name: tours tours_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.tour_categories(id);


--
-- Name: tours tours_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

