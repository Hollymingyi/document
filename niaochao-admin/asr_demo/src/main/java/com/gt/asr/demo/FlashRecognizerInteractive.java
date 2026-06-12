package com.gt.asr.demo;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.SocketTimeoutException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;
import java.util.concurrent.TimeUnit;

import com.alibaba.nls.client.AccessToken;
import okhttp3.*;

/**
 * 阿里云录音文件识别极速版 - 交互式测试
 *
 * 通过控制台输入参数进行测试
 */
public class FlashRecognizerInteractive {

    public static void main(String[] args) throws Exception {
        Scanner scanner = new Scanner(System.in);

        System.out.println("=== 阿里云录音文件识别极速版 测试工具 ===");
        System.out.println();

        System.out.print("请输入 AccessKeyId: ");
        String accessKeyId = scanner.nextLine().trim();

        System.out.print("请输入 AccessKeySecret: ");
        String accessKeySecret = scanner.nextLine().trim();

        System.out.print("请输入 AppKey: ");
        String appKey = scanner.nextLine().trim();

        System.out.print("请输入音频文件路径或URL: ");
        String fileName = scanner.nextLine().trim();

        System.out.print("请输入音频格式 (wav/mp3/m4a/aac/opus/flac/amr/speex，默认wav): ");
        String formatInput = scanner.nextLine().trim();
        String format = formatInput.isEmpty() ? detectFormat(fileName) : formatInput;

        System.out.print("请输入采样率 (8000/16000，默认8000): ");
        String sampleRateInput = scanner.nextLine().trim();
        int sampleRate = sampleRateInput.isEmpty() ? 8000 : Integer.parseInt(sampleRateInput);

        System.out.print("是否单通道 first_channel_only (y/n，默认n): ");
        String channelInput = scanner.nextLine().trim();
        boolean firstChannelOnly = "y".equalsIgnoreCase(channelInput);

        System.out.println();
        System.out.println("正在获取Token...");
        AccessToken accessToken = new AccessToken(accessKeyId, accessKeySecret);
        accessToken.apply();
        String token = accessToken.getToken();
        System.out.println("Token获取成功, 过期时间: " + accessToken.getExpireTime());

        System.out.println("正在识别...");
        process(appKey, fileName, token, format, sampleRate, firstChannelOnly);
    }

    private static void process(String appkey, String fileName, String token, String format, int sampleRate, boolean firstChannelOnly) {
        String url = "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/FlashRecognizer";
        String request = url;
        request = request + "?appkey=" + appkey;
        request = request + "&token=" + token;
        request = request + "&format=" + format;
        request = request + "&sample_rate=" + sampleRate;
        request = request + "&first_channel_only=" + firstChannelOnly;

        System.out.println("Request: " + request);

        HashMap<String, String> headers = new HashMap<>();

        long start = System.currentTimeMillis();
        String response;
        if (new File(fileName).isFile()) {
            headers.put("Content-Type", "application/octet-stream");
            response = sendPostFile(request, headers, fileName);
        } else {
            headers.put("Content-Type", "application/text");
            try {
                fileName = URLEncoder.encode(fileName, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                throw new RuntimeException(e);
            }
            response = sendPostLink(request, headers, fileName);
        }
        System.out.println("latency = " + (System.currentTimeMillis() - start) + " ms");
        if (response != null) {
            System.out.println("Response: " + response);
        } else {
            System.err.println("识别失败!");
        }
    }

    private static String getResponseWithTimeout(Request q) {
        String ret = null;
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build();

        try {
            Response s = client.newCall(q).execute();
            ret = s.body().string();
            s.close();
        } catch (SocketTimeoutException e) {
            System.err.println("get result timeout");
        } catch (IOException e) {
            System.err.println("get result error " + e.getMessage());
        }
        return ret;
    }

    private static String sendPostFile(String url, HashMap<String, String> headers, String fileName) {
        File file = new File(fileName);
        if (!file.isFile()) {
            System.err.println("The filePath is not a file: " + fileName);
            return null;
        }
        RequestBody body = RequestBody.create(MediaType.parse("application/octet-stream"), file);

        Headers.Builder hb = new Headers.Builder();
        if (headers != null) {
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                hb.add(entry.getKey(), entry.getValue());
            }
        }
        Request request = new Request.Builder()
                .url(url)
                .headers(hb.build())
                .post(body)
                .build();
        return getResponseWithTimeout(request);
    }

    private static String sendPostLink(String url, HashMap<String, String> headers, String link) {
        if (link.isEmpty()) {
            System.err.println("The send link is empty.");
            return null;
        }
        url = url + "&audio_address=" + link;

        Headers.Builder hb = new Headers.Builder();
        if (headers != null) {
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                hb.add(entry.getKey(), entry.getValue());
            }
        }
        Request request = new Request.Builder()
                .url(url)
                .headers(hb.build())
                .build();
        return getResponseWithTimeout(request);
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
        return "wav";
    }
}
