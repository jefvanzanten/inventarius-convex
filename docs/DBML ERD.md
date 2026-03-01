Table brand {
    id integer [pk, not null, unique]
    name string [not null]
}

Table product {
    id integer [pk, not null, unique]
    name string [not null]
    brand_id integer [not null, fk]
}

Table location {
    id integer [pk, not null, unique]
    parent_id integer [fk]
    name string [not null]
}

Table storage {
    id integer [pk, not null, unique]
    product_id integer [not null, fk]
    location_id integer [fk]
    amount integer [not null]
    expiration_date string 
}
