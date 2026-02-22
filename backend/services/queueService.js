const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const { generateQueueToken } = require('../utils/otpGenerator');

const isDuplicateTokenError = (error) =>
  error?.code === 11000 &&
  (error?.keyPattern?.tokenNumber || String(error?.message || '').includes('tokenNumber'));

class QueueService {
  getDayBounds(queueDate) {
    const dateObj = new Date(queueDate);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    return { dateObj, startOfDay, endOfDay };
  }

  extractTokenSequence(tokenNumber) {
    const sequencePart = String(tokenNumber || '').split('-')[1];
    const parsed = Number.parseInt(sequencePart, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async getNextGlobalTokenSequence(startOfDay, endOfDay) {
    const todaysTokens = await Queue.find({
      queueDate: { $gte: startOfDay, $lte: endOfDay },
    }).select('tokenNumber');

    let maxSequence = 0;
    for (const entry of todaysTokens) {
      const sequence = this.extractTokenSequence(entry.tokenNumber);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    return maxSequence + 1;
  }

  async createQueueEntryWithUniqueToken(payload, dateObj, startOfDay, endOfDay) {
    // Retry in case two requests race and generate the same token sequence.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const sequence = await this.getNextGlobalTokenSequence(startOfDay, endOfDay);
      const tokenNumber = generateQueueToken(dateObj, sequence);

      try {
        const queueEntry = await Queue.create({
          ...payload,
          queueDate: startOfDay,
          tokenNumber,
        });

        return queueEntry;
      } catch (error) {
        if (!isDuplicateTokenError(error) || attempt === 4) {
          throw error;
        }
      }
    }

    throw new Error('Failed to allocate unique queue token');
  }

  async addToQueue(appointmentId, patientId, doctorId, queueDate) {
    try {
      const existingQueueEntry = await Queue.findOne({ appointmentId });
      if (existingQueueEntry) {
        return existingQueueEntry;
      }

      const { dateObj, startOfDay, endOfDay } = this.getDayBounds(queueDate);

      // Find the last position for the current day and doctor
      const lastQueueEntry = await Queue.findOne({
        doctorId,
        queueDate: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ position: -1 });

      // Position is the last position + 1, or 1 if no entries exist
      const position = lastQueueEntry ? lastQueueEntry.position + 1 : 1;
      const queueEntry = await this.createQueueEntryWithUniqueToken({
        appointmentId,
        patientId,
        doctorId,
        position,
        status: 'waiting',
      }, dateObj, startOfDay, endOfDay);

      // Update appointment with queue token and position
      await Appointment.findByIdAndUpdate(appointmentId, {
        queueToken: queueEntry.tokenNumber,
        queuePosition: position,
        status: 'arrived',
      });

      return queueEntry;
    } catch (error) {
      throw new Error(`Error adding to queue: ${error.message}`);
    }
  }

  // New method to prioritize scheduled appointments
  async addPriorityToQueue(appointmentId, patientId, doctorId, queueDate) {
    try {
      const existingQueueEntry = await Queue.findOne({ appointmentId });
      if (existingQueueEntry) {
        return existingQueueEntry;
      }

      const { dateObj, startOfDay, endOfDay } = this.getDayBounds(queueDate);

      // 2. Determine Position in Queue (Priority Logic)
      // Find the first waiting patient to determine insertion point
      const firstWaiting = await Queue.findOne({
        doctorId,
        queueDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'waiting'
      }).sort('position');

      let position;
      if (firstWaiting) {
        // Insert at the front of waiting line
        position = firstWaiting.position;
        
        // Shift all existing waiting patients down by 1
        await Queue.updateMany(
          {
            doctorId,
            queueDate: { $gte: startOfDay, $lte: endOfDay },
            status: 'waiting'
          },
          { $inc: { position: 1 } }
        );
      } else {
        // No waiting patients, find the last position (could be in-consultation) or start at 1
        const lastInQueue = await Queue.findOne({
             doctorId,
             queueDate: { $gte: startOfDay, $lte: endOfDay }
        }).sort('-position');
        position = lastInQueue ? lastInQueue.position + 1 : 1;
      }

      // 3. Create Queue Entry with priority position
      const queueEntry = await this.createQueueEntryWithUniqueToken({
        appointmentId,
        patientId,
        doctorId,
        position,
        status: 'waiting',
      }, dateObj, startOfDay, endOfDay);

      // 4. Update Appointment
      await Appointment.findByIdAndUpdate(appointmentId, {
        queueToken: queueEntry.tokenNumber,
        queuePosition: position,
        status: 'arrived'
      });

      return queueEntry;
    } catch (error) {
      throw new Error(`Error adding priority to queue: ${error.message}`);
    }
  }

  async getQueueStatus(doctorId, queueDate) {
    try {
      // Create proper date range objects
      const dateObj = new Date(queueDate);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      let query = {
        queueDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };

      // Only add doctorId filter if provided
      if (doctorId) {
        query.doctorId = doctorId;
      }

      const queue = await Queue.find(query)
        .populate({
          path: 'patientId',
          populate: { path: 'userId' },
        })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' }
        })
        .populate('appointmentId')
        .sort('position');

      return queue;
    } catch (error) {
      throw new Error(`Error getting queue status: ${error.message}`);
    }
  }

  async updateQueueStatus(queueId, status) {
    try {
      const updatedQueue = await Queue.findByIdAndUpdate(
        queueId,
        { status },
        { new: true }
      );
      return updatedQueue;
    } catch (error) {
      throw new Error(`Error updating queue status: ${error.message}`);
    }
  }

  async markConsultationStarted(queueId) {
    try {
      const updatedQueue = await Queue.findByIdAndUpdate(
        queueId,
        {
          status: 'in-consultation',
          consultationStartTime: new Date(),
        },
        { new: true }
      );

      if (updatedQueue?.appointmentId) {
        await Appointment.findByIdAndUpdate(updatedQueue.appointmentId, {
          status: 'in-consultation',
        });
      }

      return updatedQueue;
    } catch (error) {
      throw new Error(`Error marking consultation started: ${error.message}`);
    }
  }

  async markConsultationCompleted(queueId) {
    try {
      const updatedQueue = await Queue.findByIdAndUpdate(
        queueId,
        {
          status: 'pending-transaction',
          consultationEndTime: new Date(),
        },
        { new: true }
      );

      if (updatedQueue?.appointmentId) {
        await Appointment.findByIdAndUpdate(updatedQueue.appointmentId, {
          status: 'pending-bill',
        });
      }

      return updatedQueue;
    } catch (error) {
      throw new Error(`Error marking consultation completed: ${error.message}`);
    }
  }

  async updateQueueOrder(queueItems) {
    try {
      const writeOps = queueItems.map((item, index) => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { position: index + 1 } }
        }
      }));

      if (writeOps.length > 0) {
        await Queue.bulkWrite(writeOps);
      }
      return true;
    } catch (error) {
      throw new Error(`Error updating queue order: ${error.message}`);
    }
  }
}

module.exports = new QueueService();
