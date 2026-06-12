package com.gt.asr.demo;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;

public class SpeechFlashRecognizerDemo {
    private String appkey;

    public SpeechFlashRecognizerDemo(String appkey) {
        this.appkey = appkey;
    }

    /**
     * 录音文件识别极速版
     * @param fileName  本地音频文件路径 或 音频文件URL（http/https链接）
     * @param token     阿里云AccessToken
     * @param format    音频格式: wav, opus, speex, m4a, mp3, aac, amr, flac
     * @param sampleRate 采样率: 8000 或 16000
     */
    public void process(String fileName, String token, String format, int sampleRate) {
        String url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/FlashRecognizer";
        String request = url;
        request = request + "?appkey=" + appkey;
        request = request + "&token=" + token;
        request = request + "&format=" + format;
        request = request + "&sample_rate=" + sampleRate;
        request = request + "&first_channel_only=false";

        System.out.println("Request: " + request);

        HashMap<String, String> headers = new HashMap<String, String>();

        long start = System.currentTimeMillis();
        String response;
        if (new File(fileName).isFile()) {
            headers.put("Content-Type", "application/octet-stream");
            response = HttpUtil.sendPostFile(request, headers, fileName);
        } else {
            headers.put("Content-Type", "application/text");
            response = HttpUtil.sendPostLink(request, headers, fileName);
        }
        System.out.println("latency = " + (System.currentTimeMillis() - start) + " ms");
        if (response != null) {
            System.out.println("Response: " + response);
        } else {
            System.err.println("识别失败!");
        }
    }
}
