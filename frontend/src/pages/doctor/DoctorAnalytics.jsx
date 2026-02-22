import React, { useEffect, useMemo, useState } from 'react';
import { Card, Loading } from '../../components/common/UI';
import { doctorAPI } from '../../api/endpoints';

const DoctorAnalytics = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, patientsRes] = await Promise.all([
        doctorAPI.getAppointments(),
        doctorAPI.getPatients(),
      ]);

      setAppointments(appointmentsRes.data.data || []);
      setPatients(patientsRes.data.data || []);
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter((a) => a.status === 'completed').length;
    const completionRate = totalAppointments ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const appointmentsThisMonth = appointments.filter(
      (a) => new Date(a.appointmentDate) >= monthStart
    ).length;

    const newPatientsThisMonth = patients.filter((p) => {
      if (!p.lastVisit) return false;
      return new Date(p.lastVisit) >= monthStart;
    }).length;

    return {
      totalPatients: patients.length,
      totalAppointments,
      completedAppointments,
      completionRate,
      appointmentsThisMonth,
      newPatientsThisMonth,
      averageRating: 4.8,
    };
  }, [appointments, patients]);

  const monthlyTrend = useMemo(() => {
    const labels = [];
    const counts = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = appointments.filter((a) => {
        const appointmentDate = new Date(a.appointmentDate);
        return appointmentDate >= start && appointmentDate <= end;
      }).length;

      labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      counts.push(count);
    }

    const max = Math.max(...counts, 1);
    return { labels, counts, max };
  }, [appointments]);

  const demographics = useMemo(() => {
    const totals = patients.reduce(
      (acc, patient) => {
        const gender = String(patient.gender || '').toLowerCase();
        if (gender === 'male') acc.male += 1;
        else if (gender === 'female') acc.female += 1;
        else acc.other += 1;
        return acc;
      },
      { male: 0, female: 0, other: 0 }
    );

    const total = totals.male + totals.female + totals.other;
    const pct = (value) => (total ? Math.round((value / total) * 100) : 0);

    return {
      total,
      rows: [
        { label: 'Male', value: totals.male, pct: pct(totals.male), color: 'bg-blue-500' },
        { label: 'Female', value: totals.female, pct: pct(totals.female), color: 'bg-pink-500' },
        { label: 'Other', value: totals.other, pct: pct(totals.other), color: 'bg-indigo-500' },
      ],
    };
  }, [patients]);

  const recentActivity = useMemo(() => {
    return [...appointments]
      .sort((a, b) => new Date(b.updatedAt || b.appointmentDate) - new Date(a.updatedAt || a.appointmentDate))
      .slice(0, 6);
  }, [appointments]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <button
          onClick={fetchAnalyticsData}
          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-gray-600">Total Patients</p>
          <p className="text-4xl font-bold text-blue-600">{metrics.totalPatients}</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-gray-600">Total Appointments</p>
          <p className="text-4xl font-bold text-green-600">{metrics.totalAppointments}</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-gray-600">Completion Rate</p>
          <p className="text-4xl font-bold text-purple-600">{metrics.completionRate}%</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-gray-600">Average Rating</p>
          <p className="text-4xl font-bold text-yellow-600">* {metrics.averageRating}</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-gray-600">Appointments This Month</p>
          <p className="text-4xl font-bold text-indigo-600">{metrics.appointmentsThisMonth}</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-gray-600">Active Patients This Month</p>
          <p className="text-4xl font-bold text-pink-600">{metrics.newPatientsThisMonth}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Monthly Appointments (Last 6 Months)</h2>
          <div className="space-y-3">
            {monthlyTrend.labels.map((label, idx) => (
              <div key={label} className="grid grid-cols-[60px_1fr_40px] gap-3 items-center">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="h-3 bg-gray-100 rounded">
                  <div
                    className="h-3 bg-blue-500 rounded"
                    style={{ width: `${Math.max(8, Math.round((monthlyTrend.counts[idx] / monthlyTrend.max) * 100))}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 text-right">{monthlyTrend.counts[idx]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Patient Demographics</h2>
          {demographics.total === 0 ? (
            <p className="text-gray-500">No patient demographic data available yet.</p>
          ) : (
            <div className="space-y-4">
              {demographics.rows.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{row.label}</span>
                    <span className="font-semibold text-gray-700">
                      {row.value} ({row.pct}%)
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded">
                    <div className={`h-3 rounded ${row.color}`} style={{ width: `${Math.max(5, row.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500">No recent activity.</p>
          ) : (
            recentActivity.map((appointment) => (
              <div key={appointment._id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <p className="text-gray-700">
                  Appointment {appointment.status} for {new Date(appointment.appointmentDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 capitalize">{appointment.status}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default DoctorAnalytics;
