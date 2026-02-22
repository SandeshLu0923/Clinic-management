const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

class SlotService {
  async getAvailableSlots(doctorId, date) {
    try {
      if (!doctorId || !date) {
        throw new Error('doctorId and date are required');
      }

      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }

      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayKeys[parsedDate.getDay()];
      const availability = doctor.availability[dayOfWeek];

      if (!availability || !availability.isAvailable) {
        return [];
      }

      // Parse availability times
      if (!availability.from || !availability.to) {
        return [];
      }
      const [startHour, startMin] = String(availability.from).split(':').map(Number);
      const [endHour, endMin] = String(availability.to).split(':').map(Number);
      if (
        Number.isNaN(startHour) || Number.isNaN(startMin) ||
        Number.isNaN(endHour) || Number.isNaN(endMin)
      ) {
        return [];
      }

      const slots = [];
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);
      let current = new Date(parsedDate);
      current.setHours(startHour, startMin, 0);

      const end = new Date(parsedDate);
      end.setHours(endHour, endMin, 0);

      // Generate 30-minute slots
      while (current < end) {
        const slotStart = current.toTimeString().slice(0, 5);
        const nextSlot = new Date(current);
        nextSlot.setMinutes(nextSlot.getMinutes() + 30);
        const slotEnd = nextSlot.toTimeString().slice(0, 5);

        // Check if slot is already booked
        const booked = await Appointment.findOne({
          doctorId,
          appointmentDate: { $gte: startOfDay, $lte: endOfDay },
          startTime: slotStart,
          status: { $ne: 'cancelled' },
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: !booked,
        });

        current = nextSlot;
      }

      return slots;
    } catch (error) {
      throw new Error(`Error getting available slots: ${error.message}`);
    }
  }

  async checkSlotAvailability(doctorId, date, startTime) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const booked = await Appointment.findOne({
        doctorId,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        startTime,
        status: { $ne: 'cancelled' },
      });

      return !booked;
    } catch (error) {
      throw new Error(`Error checking slot availability: ${error.message}`);
    }
  }
}

module.exports = new SlotService();
