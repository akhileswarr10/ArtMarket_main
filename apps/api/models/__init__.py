import uuid
from datetime import datetime
from sqlalchemy import (
    String, Text, Boolean, Integer, Numeric, TIMESTAMP,
    ForeignKey, UniqueConstraint, CheckConstraint, Index, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, TSVECTOR
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

    artist: Mapped["User"] = relationship("User", back_populates="artworks", foreign_keys=[artist_id])
    category: Mapped["Category | None"] = relationship("Category", back_populates="artworks")
    images: Mapped[list["ArtworkImage"]] = relationship("ArtworkImage", back_populates="artwork", cascade="all, delete-orphan")
    artwork_tags: Mapped[list["ArtworkTag"]] = relationship("ArtworkTag", back_populates="artwork", cascade="all, delete-orphan")
    favorites: Mapped[list["Favorite"]] = relationship("Favorite", back_populates="artwork")

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

    artwork: Mapped["Artwork"] = relationship("Artwork", back_populates="artwork_tags")
    tag: Mapped["Tag"] = relationship("Tag", back_populates="artwork_tags")


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

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="NO ACTION"), nullable=False)
    artwork_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("artworks.id", ondelete="NO ACTION"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="paid")
    shipping_details: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    buyer: Mapped["User"] = relationship("User", foreign_keys=[buyer_id])
    artwork: Mapped["Artwork"] = relationship("Artwork")

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')", name='orders_status_check'),
        Index("idx_orders_buyer_id", "buyer_id"),
        Index("idx_orders_artwork_id", "artwork_id"),
    )