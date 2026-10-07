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
-- Data for Name: amenities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.amenities (id, name, slug, description, icon, category, is_active, created_at) FROM stdin;
1	Xe du lịch đời mới	modern-tour-bus	Xe du lịch máy lạnh, ghế ngả, phục vụ suốt hành trình	bus	transport	t	2026-01-20 20:45:19.896945
2	Cano tham quan đảo	island-canoe	Cano cao tốc tham quan các đảo nổi tiếng	ship	transport	t	2026-01-20 20:45:19.896945
3	Vé máy bay khứ hồi	roundtrip-flight	Vé máy bay khứ hồi theo lịch trình tour	plane	transport	t	2026-01-20 20:45:19.896945
4	Khách sạn 3 sao	3-star-hotel	Khách sạn tiêu chuẩn 3 sao, phòng đôi hoặc ba	hotel	accommodation	t	2026-01-20 20:45:19.896945
5	Khách sạn 4 sao	4-star-hotel	Khách sạn cao cấp, tiện nghi đầy đủ, vị trí trung tâm	hotel	accommodation	t	2026-01-20 20:45:19.896945
6	Resort biển	beach-resort	Resort ven biển, không gian nghỉ dưỡng riêng tư	home	accommodation	t	2026-01-20 20:45:19.896945
7	Ăn sáng buffet	buffet-breakfast	Ăn sáng buffet tại khách sạn	utensils	meals	t	2026-01-20 20:45:19.896945
8	Bữa trưa đặc sản	local-lunch	Thưởng thức ẩm thực đặc sản địa phương	utensils	meals	t	2026-01-20 20:45:19.896945
9	Buffet hải sản	seafood-buffet	Buffet hải sản tươi sống cao cấp	utensils	meals	t	2026-01-20 20:45:19.896945
10	Hướng dẫn viên chuyên nghiệp	professional-tour-guide	Hướng dẫn viên nhiệt tình, kinh nghiệm tuyến điểm	user-tie	service	t	2026-01-20 20:45:19.896945
11	Vé tham quan	sightseeing-ticket	Vé vào cổng các điểm tham quan theo chương trình	ticket-alt	service	t	2026-01-20 20:45:19.896945
12	Bảo hiểm du lịch	travel-insurance	Bảo hiểm du lịch suốt tuyến theo quy định	shield-alt	service	t	2026-01-20 20:45:19.896945
13	Lặn ngắm san hô	snorkeling	Trải nghiệm lặn biển ngắm san hô tự nhiên	water	experience	t	2026-01-20 20:45:19.896945
14	Chèo SUP	sup-paddle	Chèo SUP thư giãn trên biển hoặc hồ	water	experience	t	2026-01-20 20:45:19.896945
15	Tắm bùn khoáng	mud-bath	Thư giãn với dịch vụ tắm bùn khoáng thiên nhiên	spa	experience	t	2026-01-20 20:45:19.896945
16	Phụ thu phòng đơn	single-room-surcharge	Phụ thu dành cho khách ở phòng đơn	plus-circle	extra	t	2026-01-20 20:45:19.896945
17	Thuê xe máy	motorbike-rental	Thuê xe máy tự do khám phá địa phương	motorcycle	extra	t	2026-01-20 20:45:19.896945
18	Vé show giải trí	entertainment-show	Vé xem show biểu diễn nghệ thuật đặc sắc	theater-masks	extra	t	2026-01-20 20:45:19.896945
\.


--
-- Data for Name: banner_slides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banner_slides (id, title, subtitle, description, image_url, mobile_image_url, alt_text, location, tag, link_url, link_text, tour_id, display_order, status, start_date, end_date, view_count, click_count, background_color, text_color, is_active, created_at, updated_at) FROM stdin;
1	Khám Phá Vẻ Đẹp Việt Nam	Hành trình khởi đầu từ đây - Trải nghiệm những điều kỳ diệu	Khám phá vẻ đẹp hùng vĩ của Vịnh Hạ Long - Di sản thiên nhiên thế giới	https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80	\N	\N	Vịnh Hạ Long, Quảng Ninh	Kỳ Quan Thiên Nhiên	\N	\N	\N	1	ACTIVE	\N	\N	0	0	\N	\N	t	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
2	Sài Gòn Sôi Động	Thành phố không ngủ với hàng ngàn điều thú vị	Trải nghiệm nhịp sống sôi động của Sài Gòn	https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=80	\N	\N	TP. Hồ Chí Minh	Văn Hóa Đô Thị	\N	\N	\N	2	ACTIVE	\N	\N	0	0	\N	\N	t	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
3	Đà Nẵng - Thành Phố Đáng Sống	Biển xanh, cát trắng và ẩm thực đỉnh cao	Khám phá thành phố biển đẹp nhất Việt Nam	https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1920&q=80	\N	\N	Đà Nẵng	Biển Đảo	\N	\N	\N	3	ACTIVE	\N	\N	0	0	\N	\N	t	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
4	Phố Cổ Hội An	Nơi thời gian ngừng trôi giữa lòng phố cổ	Dạo bước trên những con phố cổ kính đầy màu sắc	https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1920&q=80	\N	\N	Hội An, Quảng Nam	Di Sản UNESCO	\N	\N	\N	4	ACTIVE	\N	\N	0	0	\N	\N	t	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
5	Sa Pa Mùa Lúa Chín	Ruộng bậc thang vàng óng dưới nắng thu	Chiêm ngưỡng vẻ đẹp hùng vĩ của núi rừng Tây Bắc	https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=80	\N	\N	Sa Pa, Lào Cai	Núi Rừng	\N	\N	\N	5	ACTIVE	\N	\N	0	0	\N	\N	t	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
\.


--
-- Data for Name: day_places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.day_places (id, tour_day_id, place_id, visit_order, duration_minutes, notes) FROM stdin;
1	1	1	1	180	\N
2	2	1	1	300	\N
3	3	4	1	120	\N
\.


--
-- Data for Name: discount_code_usages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discount_code_usages (id, discount_code_id, order_id, discount_amount, used_at, user_id) FROM stdin;
3	4	\N	200000.00	2026-01-22 06:31:22.420933	89d8e44c-f161-4e45-8c5a-7ec721b469ce
4	4	\N	200000.00	2026-01-22 06:37:28.254276	89d8e44c-f161-4e45-8c5a-7ec721b469ce
\.


--
-- Data for Name: discount_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discount_codes (id, code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user, used_count, valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by, created_at, updated_at) FROM stdin;
1	SUMMER2026	Ưu đãi mùa hè 2026	Giảm 30% cho tất cả các tour trong mùa hè	PERCENTAGE	30.00	2000000.00	5000000.00	1000	1	0	2026-06-01 00:00:00	2026-08-31 23:59:59	t	t	\N	\N	\N	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
2	NEWYEAR500K	Tết 2026 - Giảm 500K	Giảm ngay 500.000đ cho đơn hàng từ 10 triệu	FIXED_AMOUNT	500000.00	\N	10000000.00	500	1	0	2026-01-20 00:00:00	2026-02-15 23:59:59	t	t	\N	\N	\N	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
3	FIRSTBOOKING	Ưu đãi lần đầu đặt tour	Giảm 15% cho khách hàng đặt tour lần đầu	PERCENTAGE	15.00	1000000.00	3000000.00	\N	1	0	2026-01-01 00:00:00	2026-12-31 23:59:59	t	t	\N	\N	\N	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
5	FLASH50	Flash Sale - Giảm 50%	Giảm sốc 50% trong 24h	PERCENTAGE	50.00	5000000.00	8000000.00	50	1	0	2026-01-20 00:00:00	2026-01-21 23:59:59	t	t	\N	\N	\N	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
4	VIP200K	Mã VIP giảm 200K	Dành cho khách hàng thân thiết	FIXED_AMOUNT	200000.00	\N	5000000.00	100	2	2	2026-01-20 00:00:00	2026-03-31 23:59:59	t	f	\N	\N	\N	2026-01-20 17:23:24.132944	2026-01-20 17:23:24.132944
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.locations (id, name, slug, description, type, parent_id, latitude, longitude, image_url, is_active, created_at, updated_at) FROM stdin;
1	Việt Nam	viet-nam	Quốc gia hình chữ S xinh đẹp	COUNTRY	\N	\N	\N	\N	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
2	Miền Bắc	mien-bac	\N	REGION	1	\N	\N	\N	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
3	Miền Trung	mien-trung	\N	REGION	1	\N	\N	\N	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
4	Miền Nam	mien-nam	\N	REGION	1	\N	\N	\N	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
5	Hà Nội	ha-noi	\N	CITY	2	21.028500	105.854200	https://example.com/ha-noi.jpg	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
6	Quảng Ninh	quang-ninh	\N	CITY	2	20.959900	107.042500	https://example.com/ha-long.jpg	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
7	Quảng Nam	quang-nam	\N	CITY	3	15.539400	108.019100	https://example.com/hoi-an.jpg	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
8	Đà Nẵng	da-nang	\N	CITY	3	16.054400	108.202200	https://example.com/da-nang.jpg	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
9	TP. Hồ Chí Minh	ho-chi-minh	\N	CITY	4	10.823100	106.629700	https://example.com/sai-gon.jpg	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
10	Lào Cai	lao-cai	\N	CITY	2	22.485600	103.970700	https://example.com/sapa.jpg	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
\.


--
-- Data for Name: order_amenities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_amenities (id, order_id, amenity_id, amenity_name, quantity, price_at_booking, total_price) FROM stdin;
375	37	1	Xe du lịch đời mới	1	0.00	0.00
376	37	2	Cano tham quan đảo	1	0.00	0.00
377	37	3	Vé máy bay khứ hồi	1	0.00	0.00
378	37	5	Khách sạn 4 sao	1	0.00	0.00
379	37	6	Resort biển	1	0.00	0.00
380	37	7	Ăn sáng buffet	1	0.00	0.00
381	37	9	Buffet hải sản	1	0.00	0.00
382	37	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
383	37	11	Vé tham quan	1	0.00	0.00
384	37	12	Bảo hiểm du lịch	1	0.00	0.00
385	37	13	Lặn ngắm san hô	1	350000.00	350000.00
386	37	14	Chèo SUP	1	250000.00	250000.00
387	37	15	Tắm bùn khoáng	1	400000.00	400000.00
388	37	16	Phụ thu phòng đơn	1	600000.00	600000.00
389	37	17	Thuê xe máy	1	150000.00	150000.00
390	37	18	Vé show giải trí	1	500000.00	500000.00
391	38	1	Xe du lịch đời mới	1	0.00	0.00
392	38	2	Cano tham quan đảo	1	0.00	0.00
393	38	3	Vé máy bay khứ hồi	1	0.00	0.00
394	38	5	Khách sạn 4 sao	1	0.00	0.00
395	38	6	Resort biển	1	0.00	0.00
396	38	7	Ăn sáng buffet	1	0.00	0.00
397	38	9	Buffet hải sản	1	0.00	0.00
398	38	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
399	38	11	Vé tham quan	1	0.00	0.00
400	38	12	Bảo hiểm du lịch	1	0.00	0.00
401	38	13	Lặn ngắm san hô	1	350000.00	350000.00
402	38	14	Chèo SUP	1	250000.00	250000.00
403	38	15	Tắm bùn khoáng	1	400000.00	400000.00
404	38	16	Phụ thu phòng đơn	1	600000.00	600000.00
405	38	17	Thuê xe máy	1	150000.00	150000.00
406	38	18	Vé show giải trí	1	500000.00	500000.00
407	39	1	Xe du lịch đời mới	1	0.00	0.00
408	39	2	Cano tham quan đảo	1	0.00	0.00
409	39	3	Vé máy bay khứ hồi	1	0.00	0.00
410	39	5	Khách sạn 4 sao	1	0.00	0.00
411	39	6	Resort biển	1	0.00	0.00
412	39	7	Ăn sáng buffet	1	0.00	0.00
413	39	9	Buffet hải sản	1	0.00	0.00
414	39	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
415	39	11	Vé tham quan	1	0.00	0.00
416	39	12	Bảo hiểm du lịch	1	0.00	0.00
417	39	13	Lặn ngắm san hô	1	350000.00	350000.00
418	39	14	Chèo SUP	1	250000.00	250000.00
419	39	15	Tắm bùn khoáng	1	400000.00	400000.00
420	39	16	Phụ thu phòng đơn	1	600000.00	600000.00
421	39	17	Thuê xe máy	1	150000.00	150000.00
422	39	18	Vé show giải trí	1	500000.00	500000.00
423	40	1	Xe du lịch đời mới	1	0.00	0.00
424	40	2	Cano tham quan đảo	1	0.00	0.00
425	40	3	Vé máy bay khứ hồi	1	0.00	0.00
426	40	5	Khách sạn 4 sao	1	0.00	0.00
427	40	6	Resort biển	1	0.00	0.00
428	40	7	Ăn sáng buffet	1	0.00	0.00
429	40	9	Buffet hải sản	1	0.00	0.00
430	40	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
431	40	11	Vé tham quan	1	0.00	0.00
432	40	12	Bảo hiểm du lịch	1	0.00	0.00
433	40	13	Lặn ngắm san hô	1	350000.00	350000.00
434	40	14	Chèo SUP	1	250000.00	250000.00
435	40	15	Tắm bùn khoáng	1	400000.00	400000.00
436	40	16	Phụ thu phòng đơn	1	600000.00	600000.00
437	40	17	Thuê xe máy	1	150000.00	150000.00
438	40	18	Vé show giải trí	1	500000.00	500000.00
439	41	1	Xe du lịch đời mới	1	0.00	0.00
440	41	2	Cano tham quan đảo	1	0.00	0.00
441	41	3	Vé máy bay khứ hồi	1	0.00	0.00
442	41	5	Khách sạn 4 sao	1	0.00	0.00
443	41	6	Resort biển	1	0.00	0.00
444	41	7	Ăn sáng buffet	1	0.00	0.00
445	41	9	Buffet hải sản	1	0.00	0.00
446	41	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
447	41	11	Vé tham quan	1	0.00	0.00
448	41	12	Bảo hiểm du lịch	1	0.00	0.00
449	41	13	Lặn ngắm san hô	1	350000.00	350000.00
450	41	14	Chèo SUP	1	250000.00	250000.00
451	41	15	Tắm bùn khoáng	1	400000.00	400000.00
452	41	16	Phụ thu phòng đơn	1	600000.00	600000.00
453	41	17	Thuê xe máy	1	150000.00	150000.00
454	41	18	Vé show giải trí	1	500000.00	500000.00
455	42	1	Xe du lịch đời mới	1	0.00	0.00
456	42	2	Cano tham quan đảo	1	0.00	0.00
457	42	3	Vé máy bay khứ hồi	1	0.00	0.00
458	42	5	Khách sạn 4 sao	1	0.00	0.00
459	42	6	Resort biển	1	0.00	0.00
460	42	7	Ăn sáng buffet	1	0.00	0.00
461	42	9	Buffet hải sản	1	0.00	0.00
462	42	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
463	42	11	Vé tham quan	1	0.00	0.00
464	42	12	Bảo hiểm du lịch	1	0.00	0.00
465	42	13	Lặn ngắm san hô	1	350000.00	350000.00
466	42	14	Chèo SUP	1	250000.00	250000.00
467	42	15	Tắm bùn khoáng	1	400000.00	400000.00
468	42	16	Phụ thu phòng đơn	1	600000.00	600000.00
469	42	17	Thuê xe máy	1	150000.00	150000.00
470	42	18	Vé show giải trí	1	500000.00	500000.00
471	43	1	Xe du lịch đời mới	1	0.00	0.00
472	43	2	Cano tham quan đảo	1	0.00	0.00
473	43	3	Vé máy bay khứ hồi	1	0.00	0.00
474	43	5	Khách sạn 4 sao	1	0.00	0.00
475	43	6	Resort biển	1	0.00	0.00
476	43	7	Ăn sáng buffet	1	0.00	0.00
477	43	9	Buffet hải sản	1	0.00	0.00
478	43	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
479	43	11	Vé tham quan	1	0.00	0.00
480	43	12	Bảo hiểm du lịch	1	0.00	0.00
481	43	13	Lặn ngắm san hô	1	350000.00	350000.00
482	43	14	Chèo SUP	1	250000.00	250000.00
483	43	15	Tắm bùn khoáng	1	400000.00	400000.00
484	43	16	Phụ thu phòng đơn	1	600000.00	600000.00
485	43	17	Thuê xe máy	1	150000.00	150000.00
486	43	18	Vé show giải trí	1	500000.00	500000.00
487	44	1	Xe du lịch đời mới	1	0.00	0.00
488	44	2	Cano tham quan đảo	1	0.00	0.00
489	44	3	Vé máy bay khứ hồi	1	0.00	0.00
490	44	5	Khách sạn 4 sao	1	0.00	0.00
491	44	6	Resort biển	1	0.00	0.00
492	44	7	Ăn sáng buffet	1	0.00	0.00
493	44	9	Buffet hải sản	1	0.00	0.00
494	44	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
495	44	11	Vé tham quan	1	0.00	0.00
496	44	12	Bảo hiểm du lịch	1	0.00	0.00
497	44	13	Lặn ngắm san hô	1	350000.00	350000.00
498	44	14	Chèo SUP	1	250000.00	250000.00
499	44	15	Tắm bùn khoáng	1	400000.00	400000.00
500	44	16	Phụ thu phòng đơn	1	600000.00	600000.00
501	44	17	Thuê xe máy	1	150000.00	150000.00
502	44	18	Vé show giải trí	1	500000.00	500000.00
503	45	1	Xe du lịch đời mới	1	0.00	0.00
504	45	2	Cano tham quan đảo	1	0.00	0.00
505	45	3	Vé máy bay khứ hồi	1	0.00	0.00
506	45	5	Khách sạn 4 sao	1	0.00	0.00
507	45	6	Resort biển	1	0.00	0.00
508	45	7	Ăn sáng buffet	1	0.00	0.00
509	45	9	Buffet hải sản	1	0.00	0.00
510	45	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
511	45	11	Vé tham quan	1	0.00	0.00
512	45	12	Bảo hiểm du lịch	1	0.00	0.00
513	45	13	Lặn ngắm san hô	1	350000.00	350000.00
514	45	14	Chèo SUP	1	250000.00	250000.00
515	45	15	Tắm bùn khoáng	1	400000.00	400000.00
516	45	16	Phụ thu phòng đơn	1	600000.00	600000.00
517	45	17	Thuê xe máy	1	150000.00	150000.00
518	45	18	Vé show giải trí	1	500000.00	500000.00
519	46	1	Xe du lịch đời mới	1	0.00	0.00
520	46	2	Cano tham quan đảo	1	0.00	0.00
521	46	3	Vé máy bay khứ hồi	1	0.00	0.00
522	46	5	Khách sạn 4 sao	1	0.00	0.00
523	46	6	Resort biển	1	0.00	0.00
524	46	7	Ăn sáng buffet	1	0.00	0.00
525	46	9	Buffet hải sản	1	0.00	0.00
526	46	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
527	46	11	Vé tham quan	1	0.00	0.00
528	46	12	Bảo hiểm du lịch	1	0.00	0.00
529	46	13	Lặn ngắm san hô	1	350000.00	350000.00
530	46	14	Chèo SUP	1	250000.00	250000.00
531	46	15	Tắm bùn khoáng	1	400000.00	400000.00
532	46	16	Phụ thu phòng đơn	1	600000.00	600000.00
533	46	17	Thuê xe máy	1	150000.00	150000.00
534	46	18	Vé show giải trí	1	500000.00	500000.00
535	47	1	Xe du lịch đời mới	1	0.00	0.00
536	47	2	Cano tham quan đảo	1	0.00	0.00
537	47	3	Vé máy bay khứ hồi	1	0.00	0.00
538	47	5	Khách sạn 4 sao	1	0.00	0.00
539	47	6	Resort biển	1	0.00	0.00
540	47	7	Ăn sáng buffet	1	0.00	0.00
541	47	9	Buffet hải sản	1	0.00	0.00
542	47	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
543	47	11	Vé tham quan	1	0.00	0.00
544	47	12	Bảo hiểm du lịch	1	0.00	0.00
545	47	13	Lặn ngắm san hô	1	350000.00	350000.00
546	47	14	Chèo SUP	1	250000.00	250000.00
547	47	15	Tắm bùn khoáng	1	400000.00	400000.00
548	47	16	Phụ thu phòng đơn	1	600000.00	600000.00
549	47	17	Thuê xe máy	1	150000.00	150000.00
550	47	18	Vé show giải trí	1	500000.00	500000.00
551	48	1	Xe du lịch đời mới	1	0.00	0.00
552	48	2	Cano tham quan đảo	1	0.00	0.00
553	48	3	Vé máy bay khứ hồi	1	0.00	0.00
554	48	5	Khách sạn 4 sao	1	0.00	0.00
555	48	6	Resort biển	1	0.00	0.00
556	48	7	Ăn sáng buffet	1	0.00	0.00
557	48	9	Buffet hải sản	1	0.00	0.00
558	48	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
559	48	11	Vé tham quan	1	0.00	0.00
560	48	12	Bảo hiểm du lịch	1	0.00	0.00
561	48	13	Lặn ngắm san hô	1	350000.00	350000.00
562	48	14	Chèo SUP	1	250000.00	250000.00
563	48	15	Tắm bùn khoáng	1	400000.00	400000.00
564	48	16	Phụ thu phòng đơn	1	600000.00	600000.00
565	48	17	Thuê xe máy	1	150000.00	150000.00
566	48	18	Vé show giải trí	1	500000.00	500000.00
567	49	1	Xe du lịch đời mới	1	0.00	0.00
568	49	2	Cano tham quan đảo	1	0.00	0.00
569	49	3	Vé máy bay khứ hồi	1	0.00	0.00
570	49	5	Khách sạn 4 sao	1	0.00	0.00
571	49	6	Resort biển	1	0.00	0.00
572	49	7	Ăn sáng buffet	1	0.00	0.00
573	49	9	Buffet hải sản	1	0.00	0.00
574	49	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
575	49	11	Vé tham quan	1	0.00	0.00
576	49	12	Bảo hiểm du lịch	1	0.00	0.00
577	49	13	Lặn ngắm san hô	1	350000.00	350000.00
578	49	14	Chèo SUP	1	250000.00	250000.00
579	49	15	Tắm bùn khoáng	1	400000.00	400000.00
580	49	16	Phụ thu phòng đơn	1	600000.00	600000.00
581	49	17	Thuê xe máy	1	150000.00	150000.00
582	49	18	Vé show giải trí	1	500000.00	500000.00
583	50	1	Xe du lịch đời mới	1	0.00	0.00
584	50	2	Cano tham quan đảo	1	0.00	0.00
585	50	3	Vé máy bay khứ hồi	1	0.00	0.00
586	50	5	Khách sạn 4 sao	1	0.00	0.00
587	50	6	Resort biển	1	0.00	0.00
588	50	7	Ăn sáng buffet	1	0.00	0.00
589	50	9	Buffet hải sản	1	0.00	0.00
590	50	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
591	50	11	Vé tham quan	1	0.00	0.00
592	50	12	Bảo hiểm du lịch	1	0.00	0.00
593	50	13	Lặn ngắm san hô	1	350000.00	350000.00
594	50	14	Chèo SUP	1	250000.00	250000.00
595	50	15	Tắm bùn khoáng	1	400000.00	400000.00
596	50	16	Phụ thu phòng đơn	1	600000.00	600000.00
597	50	17	Thuê xe máy	1	150000.00	150000.00
598	50	18	Vé show giải trí	1	500000.00	500000.00
599	51	1	Xe du lịch đời mới	1	0.00	0.00
600	51	4	Khách sạn 3 sao	1	0.00	0.00
601	51	7	Ăn sáng buffet	1	0.00	0.00
602	51	8	Bữa trưa đặc sản	1	0.00	0.00
603	51	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
604	51	11	Vé tham quan	1	0.00	0.00
605	51	12	Bảo hiểm du lịch	1	0.00	0.00
606	51	15	Tắm bùn khoáng	1	350000.00	350000.00
607	51	16	Phụ thu phòng đơn	1	450000.00	450000.00
608	52	1	Xe du lịch đời mới	1	0.00	0.00
609	52	4	Khách sạn 3 sao	1	0.00	0.00
610	52	7	Ăn sáng buffet	1	0.00	0.00
611	52	8	Bữa trưa đặc sản	1	0.00	0.00
612	52	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
613	52	11	Vé tham quan	1	0.00	0.00
614	52	12	Bảo hiểm du lịch	1	0.00	0.00
615	52	15	Tắm bùn khoáng	1	350000.00	350000.00
616	52	16	Phụ thu phòng đơn	1	450000.00	450000.00
617	53	1	Xe du lịch đời mới	1	0.00	0.00
618	53	4	Khách sạn 3 sao	1	0.00	0.00
619	53	7	Ăn sáng buffet	1	0.00	0.00
620	53	8	Bữa trưa đặc sản	1	0.00	0.00
621	53	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
622	53	11	Vé tham quan	1	0.00	0.00
623	53	12	Bảo hiểm du lịch	1	0.00	0.00
624	53	15	Tắm bùn khoáng	1	350000.00	350000.00
625	53	16	Phụ thu phòng đơn	1	450000.00	450000.00
626	54	1	Xe du lịch đời mới	1	0.00	0.00
627	54	4	Khách sạn 3 sao	1	0.00	0.00
628	54	7	Ăn sáng buffet	1	0.00	0.00
629	54	8	Bữa trưa đặc sản	1	0.00	0.00
630	54	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
631	54	11	Vé tham quan	1	0.00	0.00
632	54	12	Bảo hiểm du lịch	1	0.00	0.00
633	54	15	Tắm bùn khoáng	1	350000.00	350000.00
634	54	16	Phụ thu phòng đơn	1	450000.00	450000.00
635	55	1	Xe du lịch đời mới	1	0.00	0.00
636	55	4	Khách sạn 3 sao	1	0.00	0.00
637	55	7	Ăn sáng buffet	1	0.00	0.00
638	55	8	Bữa trưa đặc sản	1	0.00	0.00
639	55	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
640	55	11	Vé tham quan	1	0.00	0.00
641	55	12	Bảo hiểm du lịch	1	0.00	0.00
642	55	15	Tắm bùn khoáng	1	350000.00	350000.00
643	55	16	Phụ thu phòng đơn	1	450000.00	450000.00
644	56	1	Xe du lịch đời mới	1	0.00	0.00
645	56	4	Khách sạn 3 sao	1	0.00	0.00
646	56	7	Ăn sáng buffet	1	0.00	0.00
647	56	8	Bữa trưa đặc sản	1	0.00	0.00
648	56	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
649	56	11	Vé tham quan	1	0.00	0.00
650	56	12	Bảo hiểm du lịch	1	0.00	0.00
651	56	15	Tắm bùn khoáng	1	350000.00	350000.00
652	56	16	Phụ thu phòng đơn	1	450000.00	450000.00
669	58	1	Xe du lịch đời mới	1	0.00	0.00
670	58	2	Cano tham quan đảo	1	0.00	0.00
671	58	3	Vé máy bay khứ hồi	1	0.00	0.00
672	58	5	Khách sạn 4 sao	1	0.00	0.00
673	58	6	Resort biển	1	0.00	0.00
674	58	7	Ăn sáng buffet	1	0.00	0.00
675	58	9	Buffet hải sản	1	0.00	0.00
676	58	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
677	58	11	Vé tham quan	1	0.00	0.00
678	58	12	Bảo hiểm du lịch	1	0.00	0.00
679	58	13	Lặn ngắm san hô	1	350000.00	350000.00
680	58	14	Chèo SUP	1	250000.00	250000.00
681	58	15	Tắm bùn khoáng	1	400000.00	400000.00
682	58	16	Phụ thu phòng đơn	1	600000.00	600000.00
683	58	17	Thuê xe máy	1	150000.00	150000.00
684	58	18	Vé show giải trí	1	500000.00	500000.00
685	59	1	Xe du lịch đời mới	1	0.00	0.00
686	59	4	Khách sạn 3 sao	1	0.00	0.00
687	59	7	Ăn sáng buffet	1	0.00	0.00
688	59	8	Bữa trưa đặc sản	1	0.00	0.00
689	59	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
690	59	11	Vé tham quan	1	0.00	0.00
691	59	12	Bảo hiểm du lịch	1	0.00	0.00
692	59	15	Tắm bùn khoáng	1	350000.00	350000.00
693	59	16	Phụ thu phòng đơn	1	450000.00	450000.00
694	60	1	Xe du lịch đời mới	1	0.00	0.00
695	60	4	Khách sạn 3 sao	1	0.00	0.00
696	60	7	Ăn sáng buffet	1	0.00	0.00
697	60	8	Bữa trưa đặc sản	1	0.00	0.00
698	60	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
699	60	11	Vé tham quan	1	0.00	0.00
700	60	12	Bảo hiểm du lịch	1	0.00	0.00
701	60	15	Tắm bùn khoáng	1	350000.00	350000.00
702	60	16	Phụ thu phòng đơn	1	450000.00	450000.00
703	61	1	Xe du lịch đời mới	1	0.00	0.00
704	61	4	Khách sạn 3 sao	1	0.00	0.00
705	61	7	Ăn sáng buffet	1	0.00	0.00
706	61	8	Bữa trưa đặc sản	1	0.00	0.00
707	61	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
708	61	11	Vé tham quan	1	0.00	0.00
709	61	12	Bảo hiểm du lịch	1	0.00	0.00
710	61	15	Tắm bùn khoáng	1	350000.00	350000.00
711	61	16	Phụ thu phòng đơn	1	450000.00	450000.00
712	62	1	Xe du lịch đời mới	1	0.00	0.00
713	62	2	Cano tham quan đảo	1	0.00	0.00
714	62	3	Vé máy bay khứ hồi	1	0.00	0.00
715	62	5	Khách sạn 4 sao	1	0.00	0.00
716	62	6	Resort biển	1	0.00	0.00
717	62	7	Ăn sáng buffet	1	0.00	0.00
718	62	9	Buffet hải sản	1	0.00	0.00
719	62	10	Hướng dẫn viên chuyên nghiệp	1	0.00	0.00
720	62	11	Vé tham quan	1	0.00	0.00
721	62	12	Bảo hiểm du lịch	1	0.00	0.00
722	62	13	Lặn ngắm san hô	1	350000.00	350000.00
723	62	14	Chèo SUP	1	250000.00	250000.00
724	62	15	Tắm bùn khoáng	1	400000.00	400000.00
725	62	16	Phụ thu phòng đơn	1	600000.00	600000.00
726	62	17	Thuê xe máy	1	150000.00	150000.00
727	62	18	Vé show giải trí	1	500000.00	500000.00
\.


--
-- Data for Name: order_coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_coupons (id, order_id, discount_code_id, discount_amount, created_at) FROM stdin;
2	58	4	200000.00	2026-01-22 06:31:22.420933
3	59	4	200000.00	2026-01-22 06:37:28.254276
\.


--
-- Data for Name: order_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_participants (id, order_id, full_name, participant_type, gender, date_of_birth, id_number, nationality, phone, email, special_notes, created_at) FROM stdin;
34	37	Võ Ngọc Bảo Trân	\N	FEMALE	2004-05-21	056304000506	\N	\N	\N	\N	2026-01-22 01:38:19.617713
35	38	Võ Ngọc Bảo Trân	ADULT	FEMALE	2004-05-27	056304000506	\N	\N	\N	\N	2026-01-22 01:38:42.732382
36	39	Võ Ngọc Bảo Trân	ADULT	FEMALE	2004-05-27	056304000506	\N	\N	\N	\N	2026-01-22 01:38:48.110047
37	40	Võ Ngọc Bảo Trân	ADULT	FEMALE	2004-05-27	056304000506	\N	\N	\N	\N	2026-01-22 01:39:44.350247
38	41	Nguyễn Tuấn Anh	ADULT	MALE	2003-06-25	056304000123	\N	\N	\N	\N	2026-01-22 02:21:09.152431
39	42	Nguyeen haha	ADULT	MALE	2026-01-21	04529t4919w921	\N	\N	\N	\N	2026-01-22 02:46:58.748178
40	43	Võ Nguyên 	ADULT	FEMALE	2026-01-07	0541234567	\N	\N	\N	\N	2026-01-22 02:56:40.860202
41	44	Võ Trân 	ADULT	FEMALE	2026-01-07	056304000506	\N	\N	\N	\N	2026-01-22 03:03:21.602057
42	45	Võ Ngọc Bảo Trân	ADULT	FEMALE	2025-09-18	056304001234	\N	\N	\N	\N	2026-01-22 03:28:51.407924
43	46	Xin chao ba nha	ADULT	FEMALE	2026-01-12	1234567890	\N	\N	\N	\N	2026-01-22 03:45:52.265082
44	47	OMGNICE haha	ADULT	FEMALE	2026-01-20	05630400123	\N	\N	\N	\N	2026-01-22 04:32:21.593787
45	48	Vo Nguyen Tran An	ADULT	FEMALE	2026-01-05	04539r37r93e	\N	\N	\N	\N	2026-01-22 04:36:51.273874
46	49	Nguyen Anh Tuan	ADULT	MALE	2026-01-05	056304000507	\N	\N	\N	\N	2026-01-22 04:47:06.157627
47	50	Võ Thị Nhum 	ADULT	FEMALE	2026-01-07	056305000567	\N	\N	\N	\N	2026-01-22 04:50:46.383659
48	51	Võ Ngọc Bảo Trân	ADULT	FEMALE	2026-01-19	056304000506	\N	\N	\N	\N	2026-01-22 04:53:53.863826
49	52	Nguyen Tinh Tu	ADULT	FEMALE	2026-01-07	0345064564	\N	\N	\N	\N	2026-01-22 04:59:19.039877
50	53	Nguyen Thi Lủn 	ADULT	MALE	2026-01-10	0123456789569	\N	\N	\N	\N	2026-01-22 05:11:57.502777
51	54	Nguyễn Thị Lủng 	ADULT	FEMALE	2025-12-30	056304000506	\N	\N	\N	\N	2026-01-22 05:13:20.437288
52	55	Võ Ngọc Bảo Trân	ADULT	FEMALE	2026-01-05	056304506	\N	\N	\N	\N	2026-01-22 05:25:55.908841
53	55	Nguyễn Hà Anh	CHILD	FEMALE	2025-12-29	\N	\N	\N	\N	\N	2026-01-22 05:25:55.908841
54	56	Nguyễn Thị Hoa	ADULT	FEMALE	2025-12-29	05612345667	\N	\N	\N	\N	2026-01-22 05:37:49.410956
57	58	A	ADULT	FEMALE	2026-01-07	02384366832	\N	\N	\N	\N	2026-01-22 06:31:22.420933
58	58	B	CHILD	MALE	2026-01-14	\N	\N	\N	\N	\N	2026-01-22 06:31:22.420933
59	59	Võ Ngọc Bảo Trân	ADULT	FEMALE	2025-07-02	056304000506	\N	\N	\N	\N	2026-01-22 06:37:28.254276
60	59	Nguyễn Hà Anh	CHILD	FEMALE	2002-11-30	\N	\N	\N	\N	\N	2026-01-22 06:37:28.254276
61	60	Nguyễn Phong Vũ 	ADULT	MALE	2026-01-13	056305000123	\N	\N	\N	\N	2026-01-22 15:43:46.933214
62	61	Nguyễn Thái An	ADULT	MALE	2026-01-05	056304000506	\N	\N	\N	\N	2026-01-22 16:39:05.987721
63	62	Nguyen Kỳ An 	ADULT	MALE	2026-01-05	05630486974	\N	\N	\N	\N	2026-01-22 17:40:53.44766
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_code, tour_id, schedule_id, discount_code_id, tour_name, location_name, start_date, end_date, price_at_booking, adult_quantity, child_quantity, infant_quantity, total_participants, contact_name, contact_phone, contact_email, special_requests, subtotal, discount_amount, total_price, status, payment_status, created_at, updated_at, note, user_id, payment_method) FROM stdin;
37	ORD-1769020699634-220	1	2	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-03-01	2026-03-03	4500000.00	1	0	0	1	Võ Ngọc Bảo Trân	0338498306	tranvo@gmail.com	Chúc mừng em nha	4500000.00	0.00	4500000.00	PENDING	UNPAID	2026-01-22 01:38:19.617713	2026-01-22 01:38:19.617713	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	CASH
38	ORD-1769020722746-551	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	Võ Ngọc Bảo Trân	0338498306	trnavo@gmail.com	Hi	4800000.00	0.00	4800000.00	PENDING	UNPAID	2026-01-22 01:38:42.732382	2026-01-22 01:38:42.732382	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
39	ORD-1769020728112-588	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	Võ Ngọc Bảo Trân	0338498306	trnavo@gmail.com	Hi	4800000.00	0.00	4800000.00	PENDING	UNPAID	2026-01-22 01:38:48.110047	2026-01-22 01:38:48.110047	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
40	ORD-1769020784362-782	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	Võ Ngọc Bảo Trân	0338498306	trnavo@gmail.com	Hi	4800000.00	0.00	4800000.00	PENDING	UNPAID	2026-01-22 01:39:44.350247	2026-01-22 01:39:44.350247	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
41	ORD-1769023269161-97	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	Nguyễn Tuấn Anh	0331236574	tuananh@gmail.com	Heheh	4800000.00	0.00	4800000.00	PENDING	UNPAID	2026-01-22 02:21:09.152431	2026-01-22 02:21:09.152431	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
42	ORD-1769024818755-210	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	OKE	0338498306	oke@gmail.com	okeeeee 	4800000.00	0.00	4800000.00	PENDING	UNPAID	2026-01-22 02:46:58.748178	2026-01-22 02:46:58.748178	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
43	ORD-1769025400868-912	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	Nguyễn Võ 	0338498306	vognuyen@gmail.com	OKEEE	4800000.00	0.00	4800000.00	PENDING	UNPAID	2026-01-22 02:56:40.860202	2026-01-22 02:56:40.860202	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
44	ORD-1769025801611-741	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	Võ Trân 	0338498306	tranvo@gmail.com	HIHI	4800000.00	0.00	4800000.00	PENDING	UNPAID	2026-01-22 03:03:21.602057	2026-01-22 03:03:21.602057	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
45	ORD-1769027331428-237	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	Võ Ngọc Trâm	0338498306	trancutevai@gmail.com	oi oi troi oiiii cú tôi 	4800000.00	0.00	4800000.00	PENDING	UNPAID	2026-01-22 03:28:51.407924	2026-01-22 03:28:51.407924	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
46	ORD-1769028352283-347	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	Oke ba luon 	0338498306	okenha@gmail.com	OKE nef 	4800000.00	0.00	4800000.00	PENDING	PAID	2026-01-22 03:45:52.265082	2026-01-22 03:45:52.265082	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
47	ORD-1769031141645-659	1	2	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-03-01	2026-03-03	4500000.00	1	0	0	1	Tran ne 	0338498306	tranne@gmail.com	bo ta 	4500000.00	0.00	4500000.00	PENDING	UNPAID	2026-01-22 04:32:21.593787	2026-01-22 04:32:21.593787	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
48	ORD-1769031411297-367	1	2	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-03-01	2026-03-03	4500000.00	1	0	0	1	Nguyen Anh Nguyet	0338498306	nguyetanh@gmail.com	Bó tayyy chịu rồi 	4500000.00	0.00	4500000.00	PENDING	UNPAID	2026-01-22 04:36:51.273874	2026-01-22 04:36:51.273874	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
49	ORD-1769032026164-354	1	2	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-03-01	2026-03-03	4500000.00	1	0	0	1	Vo Ngoc Bao Tran	0338498306	tranvo@gmail.com	bo tay, qua met 	4500000.00	0.00	4500000.00	PENDING	UNPAID	2026-01-22 04:47:06.157627	2026-01-22 04:47:06.157627	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
50	ORD-1769032246406-62	1	2	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-03-01	2026-03-03	4500000.00	1	0	0	1	Nguyen Thị NHum	0338498306	nhumu@gmail.com	oke 	4500000.00	0.00	4500000.00	PENDING	UNPAID	2026-01-22 04:50:46.383659	2026-01-22 04:50:46.383659	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
52	ORD-1769032759053-412	2	3	\N	Hội An - Đà Nẵng 4N3Đ	Hà Nội	2026-02-20	2026-02-23	5200000.00	1	0	0	1	Nguyen Tinh Tu	0338498306	tutinh@gmail.com	OOKEEE	5200000.00	0.00	5200000.00	PENDING	UNPAID	2026-01-22 04:59:19.039877	2026-01-22 04:59:19.039877	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
51	ORD-1769032433864-119	2	3	\N	Hội An - Đà Nẵng 4N3Đ	Hà Nội	2026-02-20	2026-02-23	5200000.00	1	0	0	1	Võ Ngọc Bảo Trân	0338498306	tranvo@gmail.com	Troi oii cú tôiiiiii 	5200000.00	0.00	5200000.00	PENDING	PAID	2026-01-22 04:53:53.863826	2026-01-22 04:53:53.863826	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
53	ORD-1769033517522-46	2	3	\N	Hội An - Đà Nẵng 4N3Đ	Hà Nội	2026-02-20	2026-02-23	5200000.00	1	0	0	1	Nguyễn Thị Lủng	0338498306	LungNguyen@gmail.com	OKEEE	5200000.00	0.00	5200000.00	PENDING	UNPAID	2026-01-22 05:11:57.502777	2026-01-22 05:11:57.502777	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
54	ORD-1769033600449-857	2	3	\N	Hội An - Đà Nẵng 4N3Đ	Hà Nội	2026-02-20	2026-02-23	5200000.00	1	0	0	1	Nguyễn Thị Lủng 	0338498306	LungNguyen@gmail.com	oke	5200000.00	0.00	5200000.00	PENDING	PAID	2026-01-22 05:13:20.437288	2026-01-22 05:13:20.437288	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
55	ORD-1769034356006-608	2	3	\N	Hội An - Đà Nẵng 4N3Đ	Hà Nội	2026-02-20	2026-02-23	5200000.00	1	1	0	2	Võ Ngọc Bảo Trân	033849306	tranvo@gmail.com	OKE, em nhớ chị được chưa ? 	5200000.00	0.00	5200000.00	PENDING	PAID	2026-01-22 05:25:55.908841	2026-01-22 05:25:55.908841	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
56	ORD-1769035069427-917	2	3	\N	Hội An - Đà Nẵng 4N3Đ	Hà Nội	2026-02-20	2026-02-23	5200000.00	1	0	0	1	Nguyễn Thị Hoa 	0338498123	hoanguyen@gmail.com	OK !!!!	5200000.00	0.00	5200000.00	PENDING	PAID	2026-01-22 05:37:49.410956	2026-01-22 05:37:49.410956	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
58	ORD-1769038282447-640	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	1	0	2	A	0338498306	acdjcdj@gmail.com	hehehe	6800000.00	400000.00	6400000.00	PENDING	UNPAID	2026-01-22 06:31:22.420933	2026-01-22 06:31:22.420933	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	VNPAY
59	ORD-1769038648292-378	2	3	\N	Hội An - Đà Nẵng 4N3Đ	Hà Nội	2026-02-20	2026-02-23	5200000.00	1	1	0	2	Võ Ngọc Bảo Trân	0338498306	tranvo@gmail.com	Hihi em yeu chị , em nhớ chị ghê ...	8200000.00	400000.00	7800000.00	PENDING	PAID	2026-01-22 06:37:28.254276	2026-01-22 06:37:28.254276	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
60	ORD-1769071426944-893	2	3	\N	Hội An - Đà Nẵng 4N3Đ	Hà Nội	2026-02-20	2026-02-23	5200000.00	1	0	0	1	Võ Ngọc Bảo Trân	0338498306	tranvo@gmail.com	OMGNICEEE	5200000.00	0.00	5200000.00	PENDING	PAID	2026-01-22 15:43:46.933214	2026-01-22 15:43:46.933214	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
61	ORD-1769074745994-483	2	3	\N	Hội An - Đà Nẵng 4N3Đ	Hà Nội	2026-02-20	2026-02-23	5200000.00	1	0	0	1	Nguyễn Thái An	0338498306	anthai@gmail.com	omgniceee	5200000.00	0.00	5200000.00	PENDING	PAID	2026-01-22 16:39:05.987721	2026-01-22 16:39:05.987721	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
62	ORD-1769078453459-334	1	1	\N	Hạ Long - Yên Tử 3N2Đ	Miền Nam	2026-02-15	2026-02-17	4800000.00	1	0	0	1	Nguyễn Kỳ An	0338498306	kyan@gmail.com	Quá Đẳng Cáp 	4800000.00	0.00	4800000.00	PENDING	PAID	2026-01-22 17:40:53.44766	2026-01-22 17:40:53.44766	\N	89d8e44c-f161-4e45-8c5a-7ec721b469ce	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, payment_code, order_id, payment_method, amount, payment_status, transaction_code, gateway_response, paid_at, refunded_at, created_at, bankcode) FROM stdin;
2	PAY1769029416866403	46	VNPAY	4800000.00	PAID	15406063	{"vnp_Amount":"480000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #undefined","vnp_PayDate":"20260122034629","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122034552823","vnp_TransactionNo":"15406063","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15406063"}	2026-01-22 04:03:36.866	\N	2026-01-22 04:03:36.867105	\N
3	PAY1769030199070889	46	VNPAY	4800000.00	PAID	15406063	{"vnp_Amount":"480000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #undefined","vnp_PayDate":"20260122034629","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122034552823","vnp_TransactionNo":"15406063","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15406063"}	2026-01-22 04:16:39.07	\N	2026-01-22 04:16:39.072249	\N
4	PAY1769032662451318	\N	VNPAY	5200000.00	PAID	15406081	{"vnp_Amount":"520000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769032433864-119","vnp_PayDate":"20260122045448","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122045354735","vnp_TransactionNo":"15406081","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15406081"}	2026-01-22 04:57:42.451	\N	2026-01-22 04:57:42.452084	\N
5	PAY1769032794894379	\N	VNPAY	5200000.00	PAID	15406084	{"vnp_Amount":"520000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769032759053-412","vnp_PayDate":"20260122045950","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122045919518","vnp_TransactionNo":"15406084","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15406084"}	2026-01-22 04:59:54.894	\N	2026-01-22 04:59:54.894856	\N
6	PAY1769033309182830	51	VNPAY	5200000.00	PAID	15406081	{"vnp_Amount":"520000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769032433864-119","vnp_PayDate":"20260122045448","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122045354735","vnp_TransactionNo":"15406081","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15406081"}	2026-01-22 05:08:29.182	\N	2026-01-22 05:08:29.18369	\N
7	PAY1769033641439625	54	VNPAY	5200000.00	PAID	15406086	{"vnp_Amount":"520000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769033600449-857","vnp_PayDate":"20260122051356","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122051320136","vnp_TransactionNo":"15406086","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15406086"}	2026-01-22 05:14:01.439	\N	2026-01-22 05:14:01.439873	\N
8	PAY1769034430470168	55	VNPAY	5200000.00	PAID	15406089	{"vnp_Amount":"520000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769034356006-608","vnp_PayDate":"20260122052702","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122052556508","vnp_TransactionNo":"15406089","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15406089"}	2026-01-22 05:27:10.47	\N	2026-01-22 05:27:10.470493	\N
9	PAY1769035098625939	56	VNPAY	5200000.00	PAID	15406090	{"vnp_Amount":"520000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769035069427-917","vnp_PayDate":"20260122053812","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122053749408","vnp_TransactionNo":"15406090","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15406090"}	2026-01-22 05:38:18.625	\N	2026-01-22 05:38:18.625537	\N
10	PAY1769038698675340	59	VNPAY	7800000.00	PAID	15406101	{"vnp_Amount":"780000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769038648292-378","vnp_PayDate":"20260122063809","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122063728165","vnp_TransactionNo":"15406101","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15406101"}	2026-01-22 06:38:18.675	\N	2026-01-22 06:38:18.676568	\N
11	PAY176907151416555	60	VNPAY	5200000.00	PAID	15407000	{"vnp_Amount":"520000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769071426944-893","vnp_PayDate":"20260122154453","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122154348789","vnp_TransactionNo":"15407000","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15407000"}	2026-01-22 15:45:14.165	\N	2026-01-22 15:45:14.165781	\N
12	PAY176907477957273	61	VNPAY	5200000.00	PAID	15407156	{"vnp_Amount":"520000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769074745994-483","vnp_PayDate":"20260122163935","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122163906314","vnp_TransactionNo":"15407156","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15407156"}	2026-01-22 16:39:39.572	\N	2026-01-22 16:39:39.573487	\N
13	PAY176907850423756	62	VNPAY	4800000.00	PAID	15407298	{"vnp_Amount":"480000000","vnp_BankCode":"NCB","vnp_OrderInfo":"Thanh toán đơn tour #ORD-1769078453459-334","vnp_PayDate":"20260122174134","vnp_TmnCode":"V7ND59LX","vnp_TxnRef":"20260122174053755","vnp_TransactionNo":"15407298","vnp_ResponseCode":"00","vnp_TransactionStatus":"00","vnp_CardType":"ATM","vnp_BankTranNo":"VNP15407298"}	2026-01-22 17:41:44.237	\N	2026-01-22 17:41:44.238218	\N
\.


--
-- Data for Name: places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.places (id, location_id, name, slug, description, address, latitude, longitude, image_url, type, rating, is_active, created_at, updated_at) FROM stdin;
1	4	Vịnh Hạ Long	vinh-ha-long	Di sản thiên nhiên thế giới	Quảng Ninh	\N	\N	https://images.unsplash.com/photo-1528127269322-539801943592?w=800	ATTRACTION	4.90	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
2	6	Phố Cổ Hội An	pho-co-hoi-an	Phố cổ đèn lồng	Quảng Nam	\N	\N	https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800	ATTRACTION	4.80	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
3	5	Bãi Mỹ Khê	bai-my-khe	Bãi biển đẹp nhất hành tinh	Đà Nẵng	\N	\N	https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800	BEACH	4.70	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
4	7	Fansipan	fansipan	Nóc nhà Đông Dương	Sa Pa, Lào Cai	\N	\N	https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800	ATTRACTION	4.60	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
5	7	Chợ Bắc Hà	cho-bac-ha	Chợ phiên vùng cao	Bắc Hà, Lào Cai	\N	\N	https://example.com/bac-ha.jpg	OTHER	4.50	t	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
\.


--
-- Data for Name: tour_amenities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tour_amenities (id, tour_id, amenity_id, price, is_included, is_optional) FROM stdin;
1	1	1	0.00	t	f
2	1	2	0.00	t	f
3	1	3	0.00	t	f
4	1	5	0.00	t	f
5	1	6	0.00	t	f
6	1	7	0.00	t	f
7	1	9	0.00	t	f
8	1	10	0.00	t	f
9	1	11	0.00	t	f
10	1	12	0.00	t	f
11	1	13	350000.00	f	t
12	1	14	250000.00	f	t
13	1	15	400000.00	f	t
14	1	16	600000.00	f	t
15	1	17	150000.00	f	t
16	1	18	500000.00	f	t
17	2	1	0.00	t	f
18	2	4	0.00	t	f
19	2	7	0.00	t	f
20	2	8	0.00	t	f
21	2	10	0.00	t	f
22	2	11	0.00	t	f
23	2	12	0.00	t	f
24	2	15	350000.00	f	t
25	2	16	450000.00	f	t
\.


--
-- Data for Name: tour_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tour_categories (id, name, slug, description, icon, is_active, created_at) FROM stdin;
1	Du lịch biển đảo	bien-dao	Tour nghỉ dưỡng biển xanh cát trắng	beach	t	2026-01-20 18:31:50.634174
2	Du lịch văn hóa	van-hoa	Khám phá di sản, làng nghề	culture	t	2026-01-20 18:31:50.634174
3	Du lịch mạo hiểm	mao-hiem	Leo núi, trekking, khám phá	mountain	t	2026-01-20 18:31:50.634174
4	Du lịch nghỉ dưỡng	nghi-duong	Resort cao cấp, spa	relax	t	2026-01-20 18:31:50.634174
5	Du lịch miền núi	mien-nui	Sa Pa, Hà Giang, Fansipan	forest	t	2026-01-20 18:31:50.634174
\.


--
-- Data for Name: tour_days; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tour_days (id, tour_id, day_number, title, description, accommodation, meals, created_at) FROM stdin;
1	1	1	Hà Nội - Hạ Long	Di chuyển ra Vịnh Hạ Long, tham quan hang Sửng Sốt	Resort Hạ Long	Ăn trưa, tối	2026-01-20 18:31:50.634174
2	1	2	Khám phá Vịnh Hạ Long	Chèo kayak, thăm làng chài	Resort Hạ Long	Ăn sáng, trưa, tối	2026-01-20 18:31:50.634174
3	1	3	Hạ Long - Yên Tử - Hà Nội	Tham quan Yên Tử, về Hà Nội		Ăn sáng, trưa	2026-01-20 18:31:50.634174
\.


--
-- Data for Name: tour_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tour_images (id, tour_id, image_url, alt_text, is_cover, display_order, created_at) FROM stdin;
1	1	https://images.unsplash.com/photo-1528127269322-539801943592?w=1920	Vịnh Hạ Long	t	1	2026-01-20 18:31:50.634174
2	1	https://example.com/yen-tu.jpg	Yên Tử	f	2	2026-01-20 18:31:50.634174
3	2	https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1920	Phố cổ Hội An	t	1	2026-01-20 18:31:50.634174
4	3	https://res.cloudinary.com/dehehzz2t/image/upload/v1768915093/sapa-1145688_w5cpez.jpg	Fansipan	t	1	2026-01-20 18:31:50.634174
5	1	https://res.cloudinary.com/dehehzz2t/image/upload/v1768931255/bai-dinh-pagoda-2_lnesh6.jpg	yen tu	f	3	2026-01-21 00:48:20.53676
6	1	https://res.cloudinary.com/dehehzz2t/image/upload/v1768931451/OIP_3_ppqtm6.webp	Ha long	f	4	2026-01-21 00:51:25.363528
\.


--
-- Data for Name: tour_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tour_schedules (id, tour_id, start_date, end_date, price_override, available_slots, booked_slots, status, notes, created_at, updated_at, total_slots) FROM stdin;
3	2	2026-02-20	2026-02-23	\N	14	11	OPEN	\N	2026-01-20 18:31:50.634174	2026-01-22 16:39:05.987721	\N
1	1	2026-02-15	2026-02-17	4800000.00	6	12	OPEN	\N	2026-01-20 18:31:50.634174	2026-01-22 17:40:53.44766	18
2	1	2026-03-01	2026-03-03	\N	15	5	OPEN	\N	2026-01-20 18:31:50.634174	2026-01-22 04:50:46.383659	20
\.


--
-- Data for Name: tours; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tours (id, name, slug, location_id, category_id, short_description, description, highlights, included_services, excluded_services, terms_conditions, cancellation_policy, duration_days, duration_nights, base_price, child_price, infant_price, max_participants, min_participants, difficulty, transportation_type, departure_location, return_location, view_count, booking_count, rating, review_count, status, is_featured, is_hot_deal, created_at, updated_at) FROM stdin;
3	Sa Pa - Fansipan 3N2Đ	sa-pa-fansipan-3n2d	7	5	Chinh phục nóc nhà Đông Dương	Trekking ruộng bậc thang...	\N	\N	\N	\N	\N	3	2	3800000.00	\N	\N	20	1	CHALLENGING	\N	\N	\N	18	0	0.00	0	ACTIVE	f	f	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
2	Hội An - Đà Nẵng 4N3Đ	hoi-an-da-nang-4n3d	5	1	Biển xanh + phố cổ cổ kính	Thưởng thức ẩm thực miền Trung...	\N	\N	\N	\N	\N	4	3	5200000.00	3000000.00	500000.00	30	1	EASY	\N	\N	\N	70	0	0.00	0	ACTIVE	t	f	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
1	Hạ Long - Yên Tử 3N2Đ	ha-long-yen-tu-3n2d	4	2	Khám phá kỳ quan thiên nhiên và tâm linh	Tour kết hợp Hạ Long và Yên Tử...	\N	\N	\N	\N	\N	3	2	4500000.00	2000000.00	\N	25	1	MODERATE	\N	\N	\N	318	0	0.00	0	ACTIVE	t	f	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, email, phone, password_hash, role, status, avatar_url, address, created_at, updated_at, user_id) FROM stdin;
2	Nguyễn Văn A	vana@gmail.com	0912345678	$2b$10$examplehashuser1	CUSTOMER	ACTIVE	\N	\N	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174	\N
3	Trần Thị B	thib@gmail.com	0987654321	$2b$10$examplehashuser2	CUSTOMER	ACTIVE	\N	\N	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174	\N
4	Lê Văn C	vanc@gmail.com	0935123456	$2b$10$examplehashuser3	CUSTOMER	ACTIVE	\N	\N	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174	\N
1	Admin Trân	admin@travelvn.com	0909123456	$2b$10$examplehashadmin123	ADMIN	ACTIVE	https://example.com/avatar/admin.jpg	\N	2026-01-20 18:31:50.634174	2026-01-20 18:31:50.634174	89d8e44c-f161-4e45-8c5a-7ec721b469ce
\.


--
-- Name: amenities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.amenities_id_seq', 18, true);


--
-- Name: banner_slides_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.banner_slides_id_seq', 5, true);


--
-- Name: day_places_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.day_places_id_seq', 3, true);


--
-- Name: discount_code_usages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discount_code_usages_id_seq', 4, true);


--
-- Name: discount_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discount_codes_id_seq', 5, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.locations_id_seq', 10, true);


--
-- Name: order_amenities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_amenities_id_seq', 727, true);


--
-- Name: order_coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_coupons_id_seq', 3, true);


--
-- Name: order_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_participants_id_seq', 63, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 62, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 13, true);


--
-- Name: places_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.places_id_seq', 5, true);


--
-- Name: tour_amenities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tour_amenities_id_seq', 25, true);


--
-- Name: tour_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tour_categories_id_seq', 5, true);


--
-- Name: tour_days_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tour_days_id_seq', 3, true);


--
-- Name: tour_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tour_images_id_seq', 6, true);


--
-- Name: tour_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tour_schedules_id_seq', 3, true);


--
-- Name: tours_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tours_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


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

