import uuid
from datetime import datetime
from sqlalchemy import (
    String, Text, Boolean, Integer, Numeric, TIMESTAMP,
    ForeignKey, UniqueConstraint, CheckConstraint, Index, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, TSVECTOR, ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(Text(), nullable=False, unique=True)
    role: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    artist_profile: Mapped["ArtistProfile | None"] = relationship("ArtistProfile", back_populates="user", uselist=False)
    buyer_profile: Mapped["BuyerProfile | None"] = relationship("BuyerProfile", back_populates="user", uselist=False)
    artworks: Mapped[list["Artwork"]] = relationship("Artwork", back_populates="artist", foreign_keys="Artwork.artist_id")
    notifications: Mapped[list["Notification"]] = relationship("Notification", cascade="all, delete-orphan")


class ArtistProfile(Base):
    __tablename__ = "artist_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(Text(), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text(), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text(), nullable=True)
    website_url: Mapped[str | None] = mapped_column(Text(), nullable=True)
    stripe_account_id: Mapped[str | None] = mapped_column(Text(), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    address: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="unverified")
    verification_submitted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    verification_notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="artist_profile")


class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(Text(), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text(), nullable=True)
    shipping_address: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="buyer_profile")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text(), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(Text(), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    artworks: Mapped[list["Artwork"]] = relationship("Artwork", back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text(), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(Text(), nullable=False, unique=True)

    artwork_tags: Mapped[list["ArtworkTag"]] = relationship("ArtworkTag", back_populates="tag")


class Artwork(Base):
    __tablename__ = "artworks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="NO ACTION"), nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str | None] = mapped_column(Text(), nullable=True)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    medium: Mapped[str | None] = mapped_column(String(100), nullable=True)
    style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dimensions: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    view_count: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    search_vector = mapped_column(TSVECTOR(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    ai_title_suggestion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    ai_description_suggestion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    ai_style_suggestion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ai_medium_suggestion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ai_price_suggestion: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    ai_price_confidence: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ai_tags_suggestion: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    ai_generated_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    artist: Mapped["User"] = relationship("User", back_populates="artworks", foreign_keys=[artist_id])
    category: Mapped["Category | None"] = relationship("Category", back_populates="artworks")
    images: Mapped[list["ArtworkImage"]] = relationship("ArtworkImage", back_populates="artwork", cascade="all, delete-orphan")
    artwork_tags: Mapped[list["ArtworkTag"]] = relationship("ArtworkTag", back_populates="artwork", cascade="all, delete-orphan")
    favorites: Mapped[list["Favorite"]] = relationship("Favorite", back_populates="artwork")
    ai_jobs: Mapped[list["AIJob"]] = relationship("AIJob", back_populates="artwork", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published', 'sold', 'archived')", name='artworks_status_check'),
        Index("idx_artworks_artist_id", "artist_id"),
        Index("idx_artworks_status", "status"),
    )


class ArtworkImage(Base):
    __tablename__ = "artwork_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artwork_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("artworks.id", ondelete="CASCADE"), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    display_order: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    is_confirmed: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    width: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    height: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    artwork: Mapped["Artwork"] = relationship("Artwork", back_populates="images")


class ArtworkTag(Base):
    __tablename__ = "artwork_tags"

    artwork_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("artworks.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    artwork: Mapped["Artwork"] = relationship("Artwork", back_populates="artwork_tags", lazy="selectin")
    tag: Mapped["Tag"] = relationship("Tag", back_populates="artwork_tags", lazy="selectin")


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    artwork_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("artworks.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    artwork: Mapped["Artwork"] = relationship("Artwork", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "artwork_id", name="uq_favorites_user_artwork"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(Text(), nullable=False)
    entity_type: Mapped[str] = mapped_column(Text(), nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    old_data: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    new_data: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="NO ACTION"), nullable=False)
    stripe_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="usd")
    shipping_address: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    buyer: Mapped["User"] = relationship("User", foreign_keys=[buyer_id])
    items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')", name='orders_status_check'),
        Index("idx_orders_buyer_id", "buyer_id"),
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    artwork_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("artworks.id", ondelete="NO ACTION"), nullable=False)
    artist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="NO ACTION"), nullable=False)
    price_paid: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    title_snapshot: Mapped[str] = mapped_column(Text(), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    artwork: Mapped["Artwork"] = relationship("Artwork", lazy="selectin")
    artist: Mapped["User"] = relationship("User", foreign_keys=[artist_id])

class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    buyer: Mapped["User"] = relationship("User", foreign_keys=[buyer_id])
    items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan", lazy="selectin")

    @property
    def total(self) -> float:
        return sum(float(item.price_at_add or 0) for item in self.items)

class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    artwork_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("artworks.id", ondelete="CASCADE"), nullable=False)
    price_at_add: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    added_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    artwork: Mapped["Artwork"] = relationship("Artwork", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("cart_id", "artwork_id", name="uq_cart_items_cart_artwork"),
    )

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="usd")
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    stripe_response: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship("Order")

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(Text(), nullable=False)
    body: Mapped[str] = mapped_column(Text(), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    metadata_data: Mapped[dict | None] = mapped_column("metadata", JSONB(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index("idx_notifications_user_read", "user_id", "is_read"),
    )

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    value: Mapped[str] = mapped_column(Text(), nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
