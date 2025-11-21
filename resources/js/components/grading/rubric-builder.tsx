import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

interface RubricItem {
  id: number;
  criterion: string;
  description: string;
  points: number;
}

interface RubricBuilderProps {
  rubric: RubricItem[];
  onChange: (rubric: RubricItem[]) => void;
  readOnly?: boolean;
}

export default function RubricBuilder({ rubric, onChange, readOnly = false }: RubricBuilderProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    criterion: '',
    description: '',
    points: 0
  });

  const handleAddCriterion = () => {
    const newCriterion: RubricItem = {
      id: Date.now(), // Temporary ID
      criterion: '',
      description: '',
      points: 0
    };
    setEditForm({
      criterion: newCriterion.criterion,
      description: newCriterion.description,
      points: newCriterion.points
    });
    setEditingId(newCriterion.id);
    onChange([...rubric, newCriterion]);
  };

  const handleEditCriterion = (item: RubricItem) => {
    setEditForm({
      criterion: item.criterion,
      description: item.description,
      points: item.points
    });
    setEditingId(item.id);
  };

  const handleSaveCriterion = () => {
    const updatedRubric = rubric.map(item =>
      item.id === editingId
        ? { ...item, ...editForm }
        : item
    );
    onChange(updatedRubric);
    setEditingId(null);
    setEditForm({ criterion: '', description: '', points: 0 });
  };

  const handleCancelEdit = () => {
    // If this was a new item (no criterion), remove it
    if (editingId && !rubric.find(item => item.id === editingId)?.criterion) {
      onChange(rubric.filter(item => item.id !== editingId));
    }
    setEditingId(null);
    setEditForm({ criterion: '', description: '', points: 0 });
  };

  const handleDeleteCriterion = (id: number) => {
    onChange(rubric.filter(item => item.id !== id));
  };

  const totalPoints = rubric.reduce((sum, item) => sum + item.points, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rubric</h3>
          <p className="text-sm text-muted-foreground">
            Define criteria for grading this assignment
          </p>
        </div>
        {!readOnly && (
          <Button onClick={handleAddCriterion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Criterion
          </Button>
        )}
      </div>

      {rubric.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No rubric criteria defined yet.</p>
            {!readOnly && (
              <Button onClick={handleAddCriterion} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Criterion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rubric.map((item, index) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                {editingId === item.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`criterion-${item.id}`}>Criterion</Label>
                        <Input
                          id={`criterion-${item.id}`}
                          value={editForm.criterion}
                          onChange={(e) => setEditForm(prev => ({ ...prev, criterion: e.target.value }))}
                          placeholder="e.g., Content Quality"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`points-${item.id}`}>Points</Label>
                        <Input
                          id={`points-${item.id}`}
                          type="number"
                          min="0"
                          value={editForm.points}
                          onChange={(e) => setEditForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`description-${item.id}`}>Description</Label>
                      <Textarea
                        id={`description-${item.id}`}
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what constitutes excellent, good, etc. performance for this criterion"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveCriterion}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{item.criterion}</h4>
                          <Badge variant="secondary">{item.points} points</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      {!readOnly && (
                        <div className="flex gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCriterion(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCriterion(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Points:</span>
                <span className="text-2xl font-bold">{totalPoints}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}