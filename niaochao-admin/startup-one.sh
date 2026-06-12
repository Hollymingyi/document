source /etc/profile                                 #环境变量，立即生效
#!/bin/sh
#!/bin/bash
export tmp_path=/home/guangting/niaochao-jar         #将变量升级为全局环境变量，可供其他shell程序使用   export
cd $tmp_path                                        #进入目录

export AUTH=gt-auth-1.0.0.jar
export GATEWAY=gt-gateway-1.0.0.jar
export MARKET=gt-market-1.0.0.jar
export SYSTEM=gt-system-1.0.0.jar
export FILE=gt-file-1.0.0.jar
export ANALYSE=gt-analyse-1.0.0.jar


export AUTH_port=9000
export GATEWAY_port=9001
export MARKET_port=9002
export SYSTEM_port=9003
export FILE_port=9004
export ANALYSE_port=9005


                                  
case "$1" in                        # 输入的命令为 ./startup-one.sh restart RUOYIINSP  如果变量1（即restart）是start，则执行下面脚本

start)
	case "$2" in                     #如果变量2（RUOYIINSP）为ruoyifile或者RUOYIFILE,则执行下面脚本
                                                                                       #相当于case中的break;
		market|MARKET)	
			## 启动营销服务
			echo "--------开始启动营销服务---------------"
			nohup java -Xms3072m -Xmx3072m -jar $MARKET > /home/guangting/niaochao-jar/logs/market.log 2>&1 &
			MARKET_pid=`lsof -i:$MARKET_port|grep "LISTEN"|awk '{print $2}'`
			until [ -n "$MARKET_pid" ]
				do
				  MARKET_pid=`lsof -i:$MARKET_port|grep "LISTEN"|awk '{print $2}'`  
				done
			echo "MARKET_pid is $MARKET_pid"     
			echo "---------MARKET_ 启动成功-----------"
			;;
			
		auth|AUTH)	
			## 启动auth服务
			echo "--------开始启动auth服务---------------"
			nohup java -Xms1024m -Xmx1024m -jar $AUTH > /home/guangting/niaochao-jar/logs/auth.log 2>&1 &
			AUTH_pid=`lsof -i:$AUTH_port|grep "LISTEN"|awk '{print $2}'`
			until [ -n "$AUTH_pid" ]
				do
				  AUTH_pid=`lsof -i:$AUTH_port|grep "LISTEN"|awk '{print $2}'`  
				done
			echo "AUTH_pid is $AUTH_pid"     
			echo "---------AUTH_ 启动成功-----------"
			;;			
			
		gateway|GATEWAY)	
			## 启动网关服务
			echo "--------开始启动网关服务---------------"
			nohup java -Xms1024m -Xmx1024m -jar $GATEWAY > /home/guangting/niaochao-jar/logs/gateway.log 2>&1 &
			GATEWAY_pid=`lsof -i:$GATEWAY_port|grep "LISTEN"|awk '{print $2}'`
			until [ -n "$GATEWAY_pid" ]
				do
				  GATEWAY_pid=`lsof -i:$GATEWAY_port|grep "LISTEN"|awk '{print $2}'`  
				done
			echo "GATEWAY_pid is $GATEWAY_pid"     
			echo "---------GATEWAY_ 启动成功-----------"
			;;		

		system|SYSTEM)	
			## 启动系统服务
			echo "--------开始启动系统服务---------------"
			nohup java -Xms1024m -Xmx1024m -Dspring.profiles.active=dev -jar $SYSTEM > /home/guangting/niaochao-jar/logs/system.log 2>&1 &
			SYSTEM_pid=`lsof -i:$SYSTEM_port|grep "LISTEN"|awk '{print $2}'`
			until [ -n "$SYSTEM_pid" ]
				do
				  SYSTEM_pid=`lsof -i:$SYSTEM_port|grep "LISTEN"|awk '{print $2}'`  
				done
			echo "SYSTEM_pid is $SYSTEM_pid"     
			echo "---------SYSTEM_ 启动成功-----------"
			;;		

		file|FILE)	
			## 启动文件服务
			echo "--------开始启动文件服务---------------"
			nohup java -Xms1024m -Xmx1024m -jar $FILE > /home/guangting/niaochao-jar/logs/file.log 2>&1 &
			FILE_pid=`lsof -i:$FILE_port|grep "LISTEN"|awk '{print $2}'`
			until [ -n "$FILE_pid" ]
				do
				  FILE_pid=`lsof -i:$FILE_port|grep "LISTEN"|awk '{print $2}'`  
				done
			echo "FILE_pid is $FILE_pid"     
			echo "---------FILE_ 启动成功-----------"
			;;				
	
			analyse|ANALYSE)
				## 质检服务
				echo "--------开始启动质检服务---------------"
				nohup java -Xms1024m -Xmx1024m -Dspring.profiles.active=dev -jar $ANALYSE > /home/guangting/niaochao-jar/logs/analyse.log 2>&1 &
				ANALYSE_pid=`lsof -i:$ANALYSE_port|grep "LISTEN"|awk '{print $2}'`
				until [ -n "$ANALYSE_pid" ]
					do
					  ANALYSE_pid=`lsof -i:$ANALYSE_port|grep "LISTEN"|awk '{print $2}'`
					done
				echo "ANALYSE_pid is $ANALYSE_pid"
				echo "---------ANALYSE_ 启动成功-----------"
				;;
esac                                                                             #case语句结束标志
	;;
 stop)                                                                       #如果变量1（即restart）是stop，则执行下面脚本
	case "$2" in                                                             #如果变量2（RUOYIINSP）为ruoyifile或者RUOYIFILE，执行下面脚本

		market|MARKET)	
			P_ID=`ps -ef | grep -w $MARKET | grep -v "grep" | awk '{print $2}'`
			if [ "$P_ID" == "" ]; then
				echo "===MARKET process not exists or stop success"
			else
				kill -9 $P_ID
				echo "MARKET killed success"
			fi
			;;
			
		auth|AUTH)
			P_ID=`ps -ef | grep -w $AUTH | grep -v "grep" | awk '{print $2}'`
			if [ "$P_ID" == "" ]; then
				echo "===AUTH process not exists or stop success"
			else
				kill -9 $P_ID
				echo "AUTH killed success"
			fi
			;;		

		gateway|GATEWAY)
			P_ID=`ps -ef | grep -w $GATEWAY | grep -v "grep" | awk '{print $2}'`
			if [ "$P_ID" == "" ]; then
				echo "===GATEWAY process not exists or stop success"
			else
				kill -9 $P_ID
				echo "GATEWAY killed success"
			fi
			;;		

		system|SYSTEM)
			P_ID=`ps -ef | grep -w $SYSTEM | grep -v "grep" | awk '{print $2}'`
			if [ "$P_ID" == "" ]; then
				echo "===SYSTEM process not exists or stop success"
			else
				kill -9 $P_ID
				echo "SYSTEM killed success"
			fi
			;;			

		file|FILE)
			P_ID=`ps -ef | grep -w $FILE | grep -v "grep" | awk '{print $2}'`
			if [ "$P_ID" == "" ]; then
				echo "===FILE process not exists or stop success"
			else
				kill -9 $P_ID
				echo "FILE killed success"
			fi
			;;				
	
			analyse|ANALYSE)
				P_ID=`ps -ef | grep -w $ANALYSE | grep -v "grep" | awk '{print $2}'`
				if [ "$P_ID" == "" ]; then
					echo "===ANALYSE process not exists or stop success"
				else
					kill -9 $P_ID
					echo "ANALYSE killed success"
				fi
				;;
esac
	;;			
restart)                                                                    #如果变量1（即restart）是start，则执行下面脚本
        $0 stop $2                                                          # $0表示脚本名称，即startup-one.sh，$2表示第2个参数，即RUOYIFILE，合起来即执行命令，./startup-one.sh stop RUOYIFILE，即回到了stop的脚本命令
        sleep 2                                                             #休眠2秒
        $0 start $2                                                         #执行命令，./startup-one.sh start RUOYIFILE，即回到了start的脚本命令
        echo "===restart $2 success==="
        ;;   
esac                                                                        #代表case命令的执行结束
exit 0                                                                      #exit  0：正常运行程序并退出程序；  exit  1：非正常运行导致退出程序；
