export enum GripperActions {
	GRIPPER_ACTION_OPEN = 0, // Gripper commence open. Often used to release cargo.
	GRIPPER_ACTION_CLOSE = 1, // Gripper commence close. Often used to grab onto cargo.
	GRIPPER_ACTION_STOP = 2, // Gripper stop (maintain current grip position).
	GRIPPER_ACTIONS_ENUM_END = 3, // 
}