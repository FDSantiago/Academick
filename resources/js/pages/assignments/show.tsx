import CourseLayout from '@/layouts/app/course-layout';
import { Assignment, Course, Submission } from '@/types';
import { Head } from '@inertiajs/react';

interface AssignmentShowProps {
  course: Course;
  assignment: Assignment;
  submission: Submission | null;
}

export default function AssignmentShow({ course, assignment, submission }: AssignmentShowProps) {
  return (
    <>
      <Head title={assignment.title} />
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">{assignment.title}</h1>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">{assignment.description}</p>
          <p className="text-gray-600 dark:text-gray-400">Due Date: {new Date(assignment.due_date).toLocaleDateString()}</p>
          <p className="text-gray-600 dark:text-gray-400">Points Possible: {assignment.points_possible}</p>
          {submission && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
              <h2 className="text-xl font-semibold mb-2">Your Submission</h2>
              <p>Status: {submission.status}</p>
              {submission.grade && <p>Grade: {submission.grade}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}