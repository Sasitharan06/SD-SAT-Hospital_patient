// frontend/src/components/DoctorDirectory.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function DoctorDirectory({ onSelectDoctorForBooking }) {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState(null);

  const specialties = ['All', 'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Orthopedics'];

  useEffect(() => {
    fetchDoctors();
  }, [search, specialty]);

  async function fetchDoctors() {
    setLoading(true);
    try {
      const res = await api.getDoctors({ search, specialty });
      if (res.ok && res.data?.data) {
        setDoctors(res.data.data);
        setCacheStatus(res.headers['x-cache-status'] || (res.data.cached ? 'HIT' : 'MISS'));
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Search Filters */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Doctor Directory & Availability</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Queried via API Gateway (Port 3000) &rarr; Doctor Service (Port 3002) with Redis TTL cache
            </p>
          </div>
          {cacheStatus && (
            <div className={`badge ${cacheStatus === 'HIT' ? 'badge-success' : 'badge-primary'}`}>
              Redis Cache: {cacheStatus}
            </div>
          )}
        </div>

        {/* Search Input and Specialty Pills */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="Search by doctor name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {specialties.map(spec => (
              <button
                key={spec}
                onClick={() => setSpecialty(spec)}
                className={`btn btn-sm ${specialty === spec ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '9999px', padding: '6px 14px' }}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Loading certified doctors from Doctor Service...
        </div>
      ) : doctors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          No doctors found matching the query. Try resetting your search.
        </div>
      ) : (
        <div className="grid-3">
          {doctors.map(doc => (
            <div key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Doctor Head */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <img
                  src={doc.image_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200'}
                  alt={doc.name}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                    {doc.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
                    {doc.specialty}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {doc.qualification}
                  </div>
                </div>
              </div>

              {/* Bio & Details */}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, minHeight: '48px' }}>
                {doc.bio}
              </p>

              {/* Highlights */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', fontSize: '0.775rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Exp: </span>
                  <strong>{doc.experience_years} yrs</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Fee: </span>
                  <strong style={{ color: 'var(--secondary)' }}>₹{doc.consultation_fee}</strong>
                </div>
                <div>
                  <span style={{ color: '#eab308' }}>★ </span>
                  <strong>{doc.rating || 4.8}</strong>
                </div>
              </div>

              {/* Availability Info */}
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                <div>📅 Available: <strong>{doc.available_days}</strong></div>
                <div>⏰ Hours: <strong>{doc.available_time_start} - {doc.available_time_end}</strong></div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectDoctorForBooking(doc)}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'auto' }}
              >
                📅 Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
