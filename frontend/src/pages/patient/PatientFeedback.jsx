import React, { useState } from 'react';
import { Card, Button, Input } from '../../components/common/UI';

const PatientFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      doctorName: 'Dr. Robert Smith',
      date: '2025-02-10',
      rating: 5,
      comment: 'Excellent care and very attentive doctor.',
    },
    {
      id: 2,
      doctorName: 'Dr. Sarah Johnson',
      date: '2025-01-20',
      rating: 4,
      comment: 'Good consultation, friendly and professional.',
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setSelectedDoctor('');
    setRating(5);
    setComment('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!selectedDoctor.trim() || !comment.trim()) return;

    if (editingId) {
      setFeedbacks((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, doctorName: selectedDoctor.trim(), rating, comment: comment.trim(), date: new Date().toISOString().split('T')[0] }
            : item
        )
      );
    } else {
      const newFeedback = {
        id: Date.now(),
        doctorName: selectedDoctor.trim(),
        date: new Date().toISOString().split('T')[0],
        rating,
        comment: comment.trim(),
      };
      setFeedbacks((prev) => [newFeedback, ...prev]);
    }

    resetForm();
  };

  const handleEdit = (feedback) => {
    setEditingId(feedback.id);
    setSelectedDoctor(feedback.doctorName);
    setRating(feedback.rating);
    setComment(feedback.comment);
    setShowForm(true);
  };

  const getStarDisplay = (score) => {
    return '?'.repeat(score) + '?'.repeat(5 - score);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Feedback & Reviews</h1>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>{showForm ? 'Cancel' : 'Leave Feedback'}</Button>
      </div>

      {showForm && (
        <Card className="p-6 space-y-4 bg-blue-50">
          <h2 className="text-xl font-bold">{editingId ? 'Edit Feedback' : 'Leave Feedback'}</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Doctor Name</label>
            <Input placeholder="Enter doctor name" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="text-3xl cursor-pointer" type="button">
                  {star <= rating ? '?' : '?'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Your Feedback</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded"
              rows="4"
              placeholder="Share your experience..."
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              {editingId ? 'Update Feedback' : 'Submit Feedback'}
            </Button>
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">No feedback submitted yet</p>
          </Card>
        ) : (
          feedbacks.map((feedback) => (
            <Card key={feedback.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{feedback.doctorName}</h3>
                  <p className="text-sm text-gray-600">{feedback.date}</p>
                  <div className="mt-2">
                    <p className="text-lg">{getStarDisplay(feedback.rating)}</p>
                  </div>
                  <p className="text-gray-700 mt-2">{feedback.comment}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleEdit(feedback)}>
                  Edit
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientFeedback;
