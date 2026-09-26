import { supabase } from '../supabase/client.js';

function mapTask(row) {
  return { id: row.id, planId: row.plan_id, label: row.label, stage: row.stage, done: row.done };
}
function mapPlan(row, tasks) {
  return {
    id: row.id,
    userId: row.user_id,
    hospital: row.hospital,
    dischargeDate: row.discharge_date,
    provider: row.provider || '',
    followUpDate: row.follow_up_date || '',
    instructions: row.instructions || '',
    medicationSchedule: row.medication_schedule || '',
    testSchedule: row.test_schedule || '',
    notes: row.notes || '',
    tasks: (tasks || []).map(mapTask),
  };
}

const DEFAULT_TASKS = (followUpDate) => [
  { label: 'Discharge summary received', stage: 'discharge', done: true },
  { label: 'Medication schedule started', stage: 'medication', done: false },
  { label: 'Recovery instructions reviewed', stage: 'recovery', done: false },
  { label: 'Follow-up appointment scheduled', stage: 'followup', done: !!followUpDate },
  { label: 'Diagnostic test completed', stage: 'diagnostic', done: false },
  { label: 'Provider review of results', stage: 'review', done: false },
];

export async function listPlans(userId) {
  const { data: plans, error } = await supabase
    .from('post_discharge_plans')
    .select('*')
    .eq('user_id', userId)
    .order('discharge_date', { ascending: false });
  if (error) throw error;
  if (!plans || !plans.length) return [];

  const { data: tasks, error: taskErr } = await supabase
    .from('post_discharge_tasks')
    .select('*')
    .in(
      'plan_id',
      plans.map((p) => p.id)
    );
  if (taskErr) throw taskErr;

  return plans.map((p) => mapPlan(p, (tasks || []).filter((t) => t.plan_id === p.id)));
}

export async function addPlan(userId, plan) {
  const { data: row, error } = await supabase
    .from('post_discharge_plans')
    .insert({
      user_id: userId,
      hospital: plan.hospital,
      discharge_date: plan.dischargeDate,
      provider: plan.provider || '',
      follow_up_date: plan.followUpDate || null,
      instructions: plan.instructions || '',
      medication_schedule: plan.medicationSchedule || '',
      test_schedule: plan.testSchedule || '',
      notes: plan.notes || '',
    })
    .select()
    .single();
  if (error) throw error;

  const taskRows = DEFAULT_TASKS(plan.followUpDate).map((t) => ({ ...t, plan_id: row.id, user_id: userId }));
  const { data: tasks, error: taskErr } = await supabase.from('post_discharge_tasks').insert(taskRows).select();
  if (taskErr) throw taskErr;

  return mapPlan(row, tasks);
}

export async function updatePlan(id, plan) {
  const { data: row, error } = await supabase
    .from('post_discharge_plans')
    .update({
      hospital: plan.hospital,
      discharge_date: plan.dischargeDate,
      provider: plan.provider || '',
      follow_up_date: plan.followUpDate || null,
      instructions: plan.instructions || '',
      medication_schedule: plan.medicationSchedule || '',
      test_schedule: plan.testSchedule || '',
      notes: plan.notes || '',
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  const { data: tasks, error: taskErr } = await supabase.from('post_discharge_tasks').select('*').eq('plan_id', id);
  if (taskErr) throw taskErr;
  return mapPlan(row, tasks);
}

export async function setTaskDone(taskId, done) {
  const { data, error } = await supabase.from('post_discharge_tasks').update({ done }).eq('id', taskId).select().single();
  if (error) throw error;
  return mapTask(data);
}
