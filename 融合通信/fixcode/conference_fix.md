conference_video.c 
video_layer_thread_run 2225
if (canvas->new_vlayout) {
				const char *layout = switch_stristr("x", canvas->new_vlayout->name);
				char *cube[SWITCH_MAX_CODECS];
				if (layout) {
					switch_log_printf(SWITCH_CHANNEL_LOG, SWITCH_LOG_ERROR, "current layout %s!\n",canvas->new_vlayout->name);
					switch_separate_string(canvas->new_vlayout->name, 'x', cube, SWITCH_MAX_CODECS);
					if (member->video_layer_id % 2 == 0) {
						switch_img_letterbox(layer->cur_img, &layer->cur_img, canvas->img->d_w, canvas->img->d_h,"#272727");
						switch_log_printf(SWITCH_CHANNEL_LOG, SWITCH_LOG_ERROR, "height = %s!\n", cube[0]);
						if (member->video_layer_id / atoi(cube[0]) % 2 != 0) {
							switch_img_letterbox(layer->cur_img, &layer->cur_img, canvas->img->d_w, canvas->img->d_h,"#000000");
						}
					} else {
						switch_img_letterbox(layer->cur_img, &layer->cur_img, canvas->img->d_w, canvas->img->d_h, "#000000");
					}
				}
			}
