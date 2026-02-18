import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, CreditCard, DollarSign, Users } from "lucide-react"
import React, { useEffect, useState } from 'react';
import { tmpTest1, tmpTest2 } from '../api/tmpAxios';
import { testResponse } from "@/types/commontype/tmp";

const DashboardHome: React.FC = () => {

    // 상태 변수에도 타입을 지정합니다.
    // 리액트에서는 값을 직접 바꾸면 화면이 새로고침 안된다함. setUser 와 같은 특정 함수를 썼을때 새로고침 되게 되어있음(vue의watch).
    // user 의 타입은 testResponse 또는 null 만 들어올수 있다고 하는 부분이 <testResponse | null>(null) 은 초기값임.
    const [tmp, setUser] = useState<testResponse | null>(null);

    const test1Start = async () => {
        try {
            // res.data가 testResponse 타입임을 TS가 이미 알고 있습니다!
            const res = await tmpTest1(1);
            setUser(res.data);
            
            console.log(res.data); 
            console.log(res.data.test1); 
        } catch (err) {
            console.error(err);
        }
    };

    const handleButtonClick = async () => {
        try {
            const testData = {
                test1: "testData1",
                test2: "asdfasfdasdf"
            };
            const res = await tmpTest2(testData);
            console.log("Success:", res.data);
        } catch (err) {
            console.error("Failed:", err);
        }
    };

    //useEffect는 처음 화면이 그려질 때 실행되는 함수. []라면 vue 에서 onMount라고 보면 될듯.
    //배열 안에 값이 있을때, 예를들어 [user] 를 넣으면 user 값이 변할때 마다 새로고침함.
    useEffect(() => { test1Start(); }, [tmp?.test1]);

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium" onClick={test1Start}>
                            {/* ?는 값이 안들어왔을때 Cannot read property of null 에러를 막기 위함. */}
                            <div>Total Revenue + 추가한 값: {tmp?.test1}</div>
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                                +20.1% from last month
                            </p>
                            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={handleButtonClick}>
                                click
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Subscriptions
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-muted-foreground">
                            +180.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12,234</div>
                        <p className="text-xs text-muted-foreground">
                            +19% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+573</div>
                        <p className="text-xs text-muted-foreground">
                            +201 since last hour
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>
                            Check your sales overview for this month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
                            Chart Placeholder
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>
                            You made 265 sales this month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">Olivia Martin</p>
                                        <p className="text-xs text-muted-foreground">olivia.martin@email.com</p>
                                    </div>
                                    <div className="ml-auto font-medium">+$1,999.00</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default DashboardHome;