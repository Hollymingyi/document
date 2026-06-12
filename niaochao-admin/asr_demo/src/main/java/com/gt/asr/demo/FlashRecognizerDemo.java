package com.gt.asr.demo;

import com.alibaba.nls.client.AccessToken;
import java.io.File;

/**
 * 阿里云录音文件识别极速版 Demo
 *
 * 用法:
 *   java -jar asr-demo.jar <accessKeyId> <accessKeySecret> <appKey> <音频文件路径>
 *
 * 示例:
 *   java -jar asr-demo.jar LTAI5txxx xxxxxx 3nP1xxxxx ./test.wav
 *
 * API文档: https://help.aliyun.com/zh/isi/developer-reference/sdk-reference-9
 */
public class FlashRecognizerDemo {

    public static void main(String[] args) throws Exception {
        if (args.length < 4) {
            System.err.println("用法: java -jar asr-demo.jar <accessKeyId> <accessKeySecret> <appKey> <音频文件> [format] [sampleRate]");
            System.err.println("示例: java -jar asr-demo.jar LTAI5txxx xxxxxx 3nP1xxxxx ./test.wav");
            System.err.println("      java -jar asr-demo.jar LTAI5txxx xxxxxx 3nP1xxxxx ./test.mp3 mp3 16000");
            System.exit(1);
        }

        String accessKeyId = args[0];
        String accessKeySecret = args[1];
        String appKey = args[2];
        String fileName = args[3];
        String format = args.length >= 5 ? args[4] : detectFormat(fileName);
        int sampleRate = args.length >= 6 ? Integer.parseInt(args[5]) : 8000;

        // 1. 获取Token
        System.out.println("正在获取Token...");
        AccessToken accessToken = new AccessToken(accessKeyId, accessKeySecret);
        accessToken.apply();
        String token = accessToken.getToken();
        System.out.println("Token获取成功, 过期时间: " + accessToken.getExpireTime());

        // 2. 执行识别
        System.out.println("正在识别音频文件: " + fileName);
        SpeechFlashRecognizerDemo demo = new SpeechFlashRecognizerDemo(appKey);
        demo.process(fileName, token, format, sampleRate);
    }

    private static String detectFormat(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".wav")) return "wav";
        if (lower.endsWith(".mp3")) return "mp3";
        if (lower.endsWith(".m4a")) return "m4a";
        if (lower.endsWith(".aac")) return "aac";
        if (lower.endsWith(".opus")) return "opus";
        if (lower.endsWith(".flac")) return "flac";
        if (lower.endsWith(".amr")) return "amr";
        if (lower.endsWith(".speex")) return "speex";
        return "wav"; // 默认
    }
}
