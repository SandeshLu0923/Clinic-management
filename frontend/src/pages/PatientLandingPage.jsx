import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCalendar, FiFileText, FiShield, FiClock, FiUsers, FiCheckCircle, FiActivity } from 'react-icons/fi';
import { useSelector } from 'react-redux';

const features = [
  { icon: <FiCalendar size={20} />, title: 'Smart Appointment Booking', description: 'Book with verified doctors, view open slots, and confirm instantly.' },
  { icon: <FiFileText size={20} />, title: 'Medical History Access', description: 'View diagnosis notes, prescriptions, lab updates, and visit summaries in one timeline.' },
  { icon: <FiClock size={20} />, title: 'Queue Transparency', description: 'Track consultation flow and billing completion without repeated follow-up calls.' },
  { icon: <FiShield size={20} />, title: 'Consent-driven Records', description: 'Control doctor access to your records through clear consent settings.' },
];

const steps = [
  { id: '01', title: 'Create Patient Account', detail: 'Complete registration once and keep your profile ready for every visit.' },
  { id: '02', title: 'Choose Doctor & Time', detail: 'Filter by specialization, check ratings, and select a convenient slot.' },
  { id: '03', title: 'Consult & Get Rx', detail: 'Doctors update diagnosis, medicines, and follow-ups directly to your portal.' },
  { id: '04', title: 'Pay & Download Records', detail: 'Track pending bills, complete payment, and download invoice/receipt instantly.' },
];

const faqs = [
  { q: 'Can I cancel or reschedule appointments?', a: 'Yes. You can manage upcoming appointments directly from your patient dashboard.' },
  { q: 'Will doctors see all my records automatically?', a: 'No. Medical-record visibility is controlled via consent settings at booking.' },
  { q: 'How do I get prescriptions and reports?', a: 'After consultation, diagnosis, prescription, and tests are visible in your patient portal.' },
  { q: 'Can I track billing and pending payments?', a: 'Yes. Your billing section shows pending invoices, paid bills, and downloadable receipts.' },
];

const specialties = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'Dermatology',
  'Pediatrics',
];

const highlights = [
  { label: 'Average Wait Time', value: '< 20 mins' },
  { label: 'Doctors On Platform', value: '60+' },
  { label: 'Digital Prescriptions Issued', value: '1.2L+' },
  { label: 'Monthly Appointments', value: '9,500+' },
];

const PatientLandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleBookAppointment = () => {
    if (isAuthenticated && user?.role === 'patient') {
      navigate('/patient/book-appointment');
      return;
    }
    if (isAuthenticated && user?.role) {
      navigate(`/${user.role}/dashboard`);
      return;
    }
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50 text-gray-900">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-900">Clinic Management</h1>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-blue-700 hover:text-blue-900">Login</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Create Account</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-10">
          <div>
            <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 mb-4">
              Digital Patient Experience
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
              One portal for appointments, treatment updates, records, and billing.
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Manage your complete care journey with verified doctors, transparent queue updates, and secure medical access controls.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleBookAppointment} className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
                Book Appointment
              </button>
              <Link to="/register" className="px-6 py-3 rounded-lg bg-white border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50">
                Register as Patient
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white border border-blue-100 p-5 shadow-sm">
              <FiUsers className="text-blue-700 mb-2" size={22} />
              <p className="text-sm text-gray-600">Patients Served</p>
              <p className="text-2xl font-bold">12,000+</p>
            </div>
            <div className="rounded-xl bg-white border border-blue-100 p-5 shadow-sm">
              <FiCheckCircle className="text-emerald-700 mb-2" size={22} />
              <p className="text-sm text-gray-600">Successful Visits</p>
              <p className="text-2xl font-bold">48,500+</p>
            </div>
            <div className="rounded-xl bg-white border border-blue-100 p-5 shadow-sm">
              <FiActivity className="text-amber-700 mb-2" size={22} />
              <p className="text-sm text-gray-600">Specialists</p>
              <p className="text-2xl font-bold">60+</p>
            </div>
            <div className="rounded-xl bg-white border border-blue-100 p-5 shadow-sm">
              <FiShield className="text-purple-700 mb-2" size={22} />
              <p className="text-sm text-gray-600">Data Security</p>
              <p className="text-2xl font-bold">HIPAA-ready</p>
            </div>
          </div>
        </section>

        <section className="py-6">
          <h3 className="text-2xl font-bold mb-5">Why Patients Prefer This Portal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl bg-white border border-gray-200 p-5">
                <div className="text-blue-700 mb-2">{feature.icon}</div>
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8">
          <div className="rounded-2xl bg-white border border-gray-200 p-6 lg:p-8">
            <h3 className="text-2xl font-bold mb-2">Specialties Available</h3>
            <p className="text-gray-600 mb-5">
              Book consultations with specialists across major departments. Doctor profiles include experience, consultation fees, and patient ratings.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {specialties.map((specialty) => (
                <div key={specialty} className="rounded-lg border border-blue-100 bg-blue-50 text-blue-900 text-sm font-semibold text-center py-3 px-2">
                  {specialty}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8">
          <h3 className="text-2xl font-bold mb-5">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step) => (
              <div key={step.id} className="rounded-xl bg-white border border-gray-200 p-5">
                <p className="text-xs font-bold text-blue-700 mb-2">{step.id}</p>
                <h4 className="font-semibold mb-1">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8">
          <h3 className="text-2xl font-bold mb-5">Care Journey Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-xl bg-white border border-gray-200 p-5">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8">
          <div className="rounded-2xl bg-white border border-gray-200 p-6 lg:p-8">
            <h3 className="text-2xl font-bold mb-3">What You Can Do From Your Account</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-sm text-gray-700">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 mb-1">Appointments</p>
                <p>Book, reschedule, cancel, and track visit status in real time from a single timeline.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 mb-1">Medical Records</p>
                <p>View diagnosis, prescriptions, and test reports with consent-based doctor access controls.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 mb-1">Billing & Payments</p>
                <p>See itemized bills, pending transactions, payment history, and generated invoices.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 mb-1">Feedback & Follow-up</p>
                <p>Share feedback after visits and stay informed about follow-up dates and lab progress.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <h3 className="text-2xl font-bold mb-5">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl bg-white border border-gray-200 p-5">
                <h4 className="font-semibold mb-1">{faq.q}</h4>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-blue-700 text-white p-8">
          <h3 className="text-3xl font-bold mb-2">Start Managing Your Care Better</h3>
          <p className="text-blue-100 mb-6">
            Create your patient account, choose your doctor, and keep everything from diagnosis to billing in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleBookAppointment} className="px-6 py-3 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50">
              Book Appointment
            </button>
            <Link to="/login" className="px-6 py-3 rounded-lg border border-blue-300 text-white font-semibold hover:bg-blue-600">
              Login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PatientLandingPage;
