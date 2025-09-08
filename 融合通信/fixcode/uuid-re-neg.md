# uuid-re-reg

修改源码，支持 amode 和 vmode


## mod_command.c

改过来


#define MEDIA_RENEG_SYNTAX "<uuid>[ <codec_string>[[ audio mode][ video mode]]]"
SWITCH_STANDARD_API(uuid_media_neg_function)
{
	char *mycmd = NULL, *argv[4] = { 0 };
	int argc = 0;
	switch_status_t status = SWITCH_STATUS_FALSE;

	if (!zstr(cmd) && (mycmd = strdup(cmd))) {
		argc = switch_separate_string(mycmd, ' ', argv, (sizeof(argv) / sizeof(argv[0])));
	}

	if (zstr(cmd) || argc < 1 || zstr(argv[0])) {
		stream->write_function(stream, "-USAGE: %s\n", MEDIA_RENEG_SYNTAX);
	} else {
		switch_core_session_message_t msg = { 0 };
		switch_core_session_t *lsession = NULL;
		char *uuid = argv[0];

		msg.message_id = SWITCH_MESSAGE_INDICATE_MEDIA_RENEG;
		msg.string_arg = argv[1];
		msg.from = __FILE__;

		if (argc >= 2) {
			msg.string_array_arg[0] = argv[2];
		}

		if (argc >= 3) {
			msg.string_array_arg[1] = argv[3];
		}

		if (*uuid == '+') {
			msg.numeric_arg++;
			uuid++;
		}

		if ((lsession = switch_core_session_locate(uuid))) {
			status = switch_core_session_receive_message(lsession, &msg);
			switch_core_session_rwunlock(lsession);
		}
	}

	if (status == SWITCH_STATUS_SUCCESS) {
		stream->write_function(stream, "+OK Success\n");
	} else {
		stream->write_function(stream, "-ERR Operation Failed\n");
	}

	switch_safe_free(mycmd);
	return SWITCH_STATUS_SUCCESS;
}

## switch_core_media.c

增加一个函数

static switch_media_flow_t media_flow_get_mode_from_string(const char *mode_str)
{
	if (!mode_str) return SWITCH_MEDIA_FLOW_DISABLED;

	if (!strncmp(mode_str, "sendonly", 8)) {
		return SWITCH_MEDIA_FLOW_SENDONLY;
	} else if (!strncmp(mode_str, "recvonly", 8)) {
		return SWITCH_MEDIA_FLOW_RECVONLY;
	} else if (!strncmp(mode_str, "sendrecv", 8)) {
		return SWITCH_MEDIA_FLOW_SENDRECV;
	} else if (!strncmp(mode_str, "inactive", 8)) {
		return SWITCH_MEDIA_FLOW_INACTIVE;
	} else {
		return SWITCH_MEDIA_FLOW_DISABLED;
	}
}

## switch_core_media.c

改过来


	case SWITCH_MESSAGE_INDICATE_MEDIA_RENEG:
		{
			switch_core_session_t *nsession;

			if (msg->string_arg) {
				const char *sr = NULL;

				switch_channel_set_variable(session->channel, "absolute_codec_string", NULL);

				if (*msg->string_arg == '=') {
					int i;
					for (i = 0; i < MESSAGE_STRING_ARG_MAX; i++) {
						const char *arg = msg->string_array_arg[i];

						if (!arg) break;

						if (!strncmp(arg, "amode=", 6)) {
							switch_media_flow_t amode = media_flow_get_mode_from_string(arg + 6);
							sr = arg + 6;
							switch_core_media_set_smode(session, SWITCH_MEDIA_TYPE_AUDIO, amode, SDP_TYPE_REQUEST);
						} else if (!strncmp(arg, "vmode=", 6)) {
							switch_media_flow_t vmode = media_flow_get_mode_from_string(arg + 6);
							switch_core_media_set_smode(session, SWITCH_MEDIA_TYPE_VIDEO, vmode, SDP_TYPE_REQUEST);
						}
					}

					switch_channel_set_variable(session->channel, "codec_string", msg->string_arg);
				} else {
					switch_channel_set_variable_printf(session->channel,
													   "codec_string", "=%s", switch_channel_get_variable(session->channel, "ep_codec_string"));
				}
				
				a_engine->codec_negotiated = 0;
				v_engine->codec_negotiated = 0;
				smh->num_negotiated_codecs = 0;
				switch_channel_clear_flag(session->channel, CF_VIDEO_POSSIBLE);
				switch_core_media_prepare_codecs(session, SWITCH_TRUE);
				switch_core_media_check_video_codecs(session);
				switch_core_media_gen_local_sdp(session, SDP_TYPE_REQUEST, NULL, 0, sr, 1);
			}

			if (msg->numeric_arg && switch_core_session_get_partner(session, &nsession) == SWITCH_STATUS_SUCCESS) {
				msg->numeric_arg = 0;
				switch_core_session_receive_message(nsession, msg);
				switch_core_session_rwunlock(nsession);
			}

		}
		break;
