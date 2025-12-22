export enum MavFtpErr {
	MAV_FTP_ERR_NONE = 0, // None: No error
	MAV_FTP_ERR_FAIL = 1, // Fail: Unknown failure
	MAV_FTP_ERR_FAILERRNO = 2, // FailErrno: Command failed, Err number sent back in PayloadHeader.data[1].
		This is a file-system error number understood by the server operating system.
	MAV_FTP_ERR_INVALIDDATASIZE = 3, // InvalidDataSize: Payload size is invalid
	MAV_FTP_ERR_INVALIDSESSION = 4, // InvalidSession: Session is not currently open
	MAV_FTP_ERR_NOSESSIONSAVAILABLE = 5, // NoSessionsAvailable: All available sessions are already in use
	MAV_FTP_ERR_EOF = 6, // EOF: Offset past end of file for ListDirectory and ReadFile commands
	MAV_FTP_ERR_UNKNOWNCOMMAND = 7, // UnknownCommand: Unknown command / opcode
	MAV_FTP_ERR_FILEEXISTS = 8, // FileExists: File/directory already exists
	MAV_FTP_ERR_FILEPROTECTED = 9, // FileProtected: File/directory is write protected
	MAV_FTP_ERR_FILENOTFOUND = 10, // FileNotFound: File/directory not found
	MAV_FTP_ERR_ENUM_END = 11, // 
}