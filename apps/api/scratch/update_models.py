import re

with open('models/__init__.py', 'r') as f:
    content = f.read()

# Update ArtistProfile
artist_profile_repl = """    address: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="unverified")
    verification_submitted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    verification_notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())"""
content = re.sub(r'    address: Mapped\[dict \| None\] = mapped_column\(JSONB\(\), nullable=True\)\n    created_at: Mapped\[datetime\] = mapped_column\(TIMESTAMP\(timezone=True\), server_default=func.now\(\)\)', artist_profile_repl, content)

# Update order and onwards
match = re.search(r'class AuditLog\(Base\):', content)
if match:
    start_idx = match.start()

    new_models = """class AuditLog(Base):
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
    items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

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
    artwork: Mapped["Artwork"] = relationship("Artwork")
    artist: Mapped["User"] = relationship("User", foreign_keys=[artist_id])

class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    buyer: Mapped["User"] = relationship("User", foreign_keys=[buyer_id])
    items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    artwork_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("artworks.id", ondelete="CASCADE"), nullable=False)
    price_at_add: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    added_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    artwork: Mapped["Artwork"] = relationship("Artwork")

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
"""

    content = content[:start_idx] + new_models

    with open('models/__init__.py', 'w') as f:
        f.write(content)
    print("Models updated.")
