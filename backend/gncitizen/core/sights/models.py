#!/usr/bin/python3
# -*- coding: UTF-8 -*-

from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import UUID

from gncitizen.core.taxonomy.models import BibNoms
from gncitizen.utils.utilssqlalchemy import serializable, geoserializable
from server import db

bibnoms = BibNoms


@serializable
@geoserializable
class SightModel(db.Model):
    """Table des observations"""
    __tablename__ = 'sights'
    __table_args__ = {'schema': 'gncitizen'}
    id_sight = db.Column(db.Integer, primary_key=True, unique=True)
    uuid_sinp = db.Column(UUID(as_uuid=True), nullable=False, unique=True)
    cd_nom = db.Column(db.Integer, db.ForeignKey('taxonomie.bib_noms.cd_nom'))
    specie = db.Column(db.String(200))
    date = db.Column(db.DATE, nullable=False)
    id_role = db.Column(db.Integer, db.ForeignKey('gncitizen.users.id_user'))
    obs_txt = db.Column(db.String(150))
    email = db.Column(db.String(150))
    phone = db.Column(db.String(150))
    count = db.Column(db.Integer)
    comment = db.Column(db.String(300))
    geom = db.Column(Geometry('POINT', 4326))
    municipality = db.Column(db.Integer, db.ForeignKey('ref_geo.l_areas.id_area'))
    timestamp_create = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    photo = db.Column(db.Text)
