import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAppointments, updateAppointment } from '../services/appointmentService';
import { FHIRAppointment } from '../types/fhir';
import NewAppointmentModal from '../components/NewAppointmentModal';

function statusBadgeClass(status: FHIRAppointment['status']): string {
  switch (status) {
    case 'booked':    return 'badge-planned';
    case 'fulfilled': return 'badge-finished';
    case 'arrived':   return 'badge-inprogress';
    case 'cancelled': return 'badge-cancelled';
    case 'noshow':    return 'badge-inactive';
    case 'pending':   return 'badge-inprogress';
    case 'proposed':  return 'badge-inactive';
    default:          return 'badge-inactive';
  }
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function getPatientFromParticipants(apt: FHIRAppointment): string {
  const patient = apt.participant.find(p =>
    p.actor?.reference?.startsWith('Patient/')
  );
  return patient?.actor?.display
    ?? patient?.actor?.reference?.split('/')[1]
    ?? '—';
}

function getPractitionerFromParticipants(apt: FHIRAppointment): string {
  const practitioner = apt.participant.find(p =>
    !p.actor?.reference?.startsWith('Patient/')
  );
  return practitioner?.actor?.display ?? '—';
}

export default function AppointmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading, isError } = useQuery<FHIRAppointment[]>({
    queryKey: ['appointments'],
    queryFn: getAllAppointments,
  });

  // Status transition mutations
  const arriveMutation = useMutation({
    mutationFn: (apt: FHIRAppointment) =>
      updateAppointment(apt.id!, { ...apt, status: 'arrived' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const fulfillMutation = useMutation({
    mutationFn: (apt: FHIRAppointment) =>
      updateAppointment(apt.id!, { ...apt, status: 'fulfilled' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (apt: FHIRAppointment) =>
      updateAppointment(apt.id!, { ...apt, status: 'cancelled' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const noshowMutation = useMutation({
    mutationFn: (apt: FHIRAppointment) =>
      updateAppointment(apt.id!, { ...apt, status: 'noshow' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const filtered = appointments.filter(a =>
    statusFilter === 'all' ? true : a.status === statusFilter
  );

  const counts = {
    booked:    appointments.filter(a => a.status === 'booked').length,
    arrived:   appointments.filter(a => a.status === 'arrived').length,
    fulfilled: appointments.filter(a => a.status === 'fulfilled').length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Appointments</div>
          <div className="page-sub">Scheduled visits across all patients</div>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Book Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Booked</div>
          <div className="stat-value" style={{color:'#2563eb'}}>{counts.booked}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Arrived</div>
          <div className="stat-value" style={{color:'#d97706'}}>{counts.arrived}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fulfilled</div>
          <div className="stat-value" style={{color:'#16a34a'}}>{counts.fulfilled}</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <span style={{fontSize:'12px', color:'#6b7280'}}>Filter:</span>
          {['all', 'proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow'].map(s => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? 'filter-chip-active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
          <span style={{fontSize:'12px', color:'#6b7280', marginLeft:'auto'}}>
            {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading && <div className="state-box">Loading appointments...</div>}
        {isError && (
          <div className="state-box" style={{color:'#dc2626'}}>
            Could not load appointments. Is your FHIR server running?
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="state-box">
            No appointments found. Click "+ Book Appointment" to schedule one.
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Service</th>
                <th>Practitioner</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(apt => (
                <tr key={apt.id}>
                  <td>{getPatientFromParticipants(apt)}</td>
                  <td>{apt.serviceType?.[0]?.text ?? '—'}</td>
                  <td style={{fontSize:'12px'}}>
                    {getPractitionerFromParticipants(apt)}
                  </td>
                  <td style={{fontSize:'12px'}}>{formatDateTime(apt.start)}</td>
                  <td style={{fontSize:'12px'}}>{formatDateTime(apt.end)}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    <div style={{display:'flex', gap:'4px', flexWrap:'wrap'}}>
                      {apt.status === 'booked' && (
                        <>
                          <button
                            className="btn-sm btn-success"
                            style={{flex:'none', padding:'3px 8px', fontSize:'11px'}}
                            onClick={() => arriveMutation.mutate(apt)}
                            disabled={arriveMutation.isPending}
                          >
                            ✓ Arrived
                          </button>
                          <button
                            className="btn-sm btn-danger"
                            style={{flex:'none', padding:'3px 8px', fontSize:'11px'}}
                            onClick={() => cancelMutation.mutate(apt)}
                            disabled={cancelMutation.isPending}
                          >
                            ✕ Cancel
                          </button>
                        </>
                      )}
                      {apt.status === 'arrived' && (
                        <>
                          <button
                            className="btn-sm btn-success"
                            style={{flex:'none', padding:'3px 8px', fontSize:'11px'}}
                            onClick={() => fulfillMutation.mutate(apt)}
                            disabled={fulfillMutation.isPending}
                          >
                            ✓ Fulfilled
                          </button>
                          <button
                            className="btn-sm btn-danger"
                            style={{flex:'none', padding:'3px 8px', fontSize:'11px'}}
                            onClick={() => noshowMutation.mutate(apt)}
                            disabled={noshowMutation.isPending}
                          >
                            No Show
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && <NewAppointmentModal onClose={() => setShowModal(false)} />}
    </div>
  );
}