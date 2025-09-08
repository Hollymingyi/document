 q freeswitch 主动发送reinvite会导致通话终端，可以关闭sip_update_refresher
<param name="enable-timer" value="1"/>
<param name="minimum-session-expires" value="90"/>
<param name="session-timeout" value="1800"/>
<X-PRE-PROCESS cmd="set" data="sip_update_refresher=true"/>

 Session-Expires头域中包含保活时间和刷新方
当最终协商的刷新方为UAC时，则响应中必须携带Require：timer，表示UAC必须支持会话保活发送Update/re-Invite。当最终协商的刷新方为UAS，且请求中携带Supported：timer，则响应中应当携带Require：timer，当会话超时时UAC应当主动发送Bye。

