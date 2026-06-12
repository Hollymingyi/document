# 离线质检优化
1. /offline-qc/task-detail/2056992083292250114 这个页面查看命中录音的时候的应该是只看到命中的录音，现在是把所有的录音都查出来了
2. /offline-qc/record-detail/rec_5e9598e81c204fb98996a854 看到 命中负向项2项 但是评分卡明细这里怎么没有看到有命中选项卡？
3. /offline-qc/record-detail/rec_5e9598e81c204fb98996a854同时 命中负向项2项 这个要是可以点击的，点击的时候把命中的两项立即显示出来
4. /offline-qc/scorecard 历史重跑 指定任务（可选，不选则重跑全部）这个下拉框要可以模糊搜索，比如输入1737就要显示跟这个batch no相似的记录

# 注意事项
1 如果涉及后台的修改就只是编译不重启
2 如果不涉及后台修改请用playwright-cli 登录https://nestify.nanjingguangting.com/ 然后测试以上修改是否正常