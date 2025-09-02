import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Calendar, Clock, Save } from "lucide-react";
import { eventsApi } from "../services/api";
import { CreateEventData } from "../types";

interface AddEventFormProps {
  onClose: () => void;
  onEventCreated: () => void;
}

interface FormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

const AddEventForm: React.FC<AddEventFormProps> = ({ onClose, onEventCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
    },
  });

  const startTime = watch("startTime");

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      // Combine date and time into ISO strings
      const startDateTime = new Date(`${data.date}T${data.startTime}:00`).toISOString();
      const endDateTime = new Date(`${data.date}T${data.endTime}:00`).toISOString();

      // Validate times
      if (new Date(endDateTime) <= new Date(startDateTime)) {
        setError("End time must be after start time");
        return;
      }

      const eventData: CreateEventData = {
        title: data.title,
        start_time: startDateTime,
        end_time: endDateTime,
      };

      await eventsApi.createEvent(eventData);
      onEventCreated();
    } catch (error: any) {
      console.error("Error creating event:", error);
      setError(error.response?.data?.error || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Event</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <input
              {...register("title", { required: "Title is required" })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter event title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date
            </label>
            <input
              {...register("date", { required: "Date is required" })}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="inline h-4 w-4 mr-1" />
                Start Time
              </label>
              <input
                {...register("startTime", { required: "Start time is required" })}
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>}
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                {...register("endTime", {
                  required: "End time is required",
                  validate: (value) => value > startTime || "End time must be after start time",
                })}
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventForm;
