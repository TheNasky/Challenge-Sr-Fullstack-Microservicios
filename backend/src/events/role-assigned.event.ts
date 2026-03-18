export class RoleAssignedEvent {
  static readonly eventName = 'role.assigned';

  constructor(
    public readonly userId: number,
    public readonly roleId: number,
    public readonly assignedAt: Date = new Date(),
    public readonly assignedByUserId?: number,
  ) {}
}

