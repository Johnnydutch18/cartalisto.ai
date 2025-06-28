// 🧹 Temporary withTeam wrapper until Supabase is fully connected

export function withTeam(fn: any) {
  return async (...args: any[]) => {
    // Provide a fake team object so app doesn’t crash
    const fakeTeam = {
      id: 'team_dummy_id',
      name: 'Placeholder Team',
    };

    return await fn(...args, fakeTeam);
  };
}
