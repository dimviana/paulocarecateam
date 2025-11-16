import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Student } from '../types';
import Card from '../components/ui/Card';
import StudentAttendanceChart from '../components/charts/StudentAttendanceChart';
import { IconAward, IconCalendar, IconDollarSign, IconMedal, IconUpload } from '../constants';
import Button from '../components/ui/Button';

const calculateTrainingTime = (startDateString?: string): { years: number; months: number; totalMonths: number } => {
  if (!startDateString) return { years: 0, months: 0, totalMonths: 0 };
  const startDate = new Date(startDateString);
  const now = new Date();
  
  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, totalMonths: years * 12 + months };
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | React.ReactNode; color: string }> = ({ icon, title, value, color }) => (
  <Card className="flex items-center p-5">
    <div className={`p-3 rounded-lg mr-4`} style={{ backgroundColor: `${color}1A`}}>
        <div style={{ color: color }}>{icon}</div>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  </Card>
);

interface StudentDashboardProps {
  student?: Student;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student: studentProp }) => {
    const { user, students, graduations, schedules, attendanceRecords, loading, themeSettings, updateStudentPayment } = useContext(AppContext);

    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isPaying, setIsPaying] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const studentDataFromContext = useMemo(() => students.find(s => s.id === user?.studentId), [students, user]);
    const studentData = studentProp || studentDataFromContext;

    const graduation = useMemo(() => graduations.find(g => g.id === studentData?.beltId), [graduations, studentData]);
    const nextGraduation = useMemo(() => graduations.sort((a,b) => a.rank - b.rank).find(g => g.rank > (graduation?.rank ?? 0)), [graduations, graduation]);

    const { totalMonths: trainingMonths } = calculateTrainingTime(studentData?.firstGraduationDate);

    const timeToNextGrad = useMemo(() => {
        if (!graduation || !nextGraduation) return null;
        const timeNeeded = graduation.minTimeInMonths;
        const timeRemaining = Math.max(0, timeNeeded - (trainingMonths % timeNeeded));
        return `${timeRemaining} meses`;
    }, [graduation, nextGraduation, trainingMonths]);
    
    const stripes = useMemo(() => {
        if (!graduation || graduation.minTimeInMonths <= 0) return 0;
        const monthsInCurrentBelt = trainingMonths % graduation.minTimeInMonths;
        return Math.min(Math.floor(monthsInCurrentBelt / 6), 4);
    }, [trainingMonths, graduation]);
    
    const studentSchedules = useMemo(() => {
      if (!studentData) return [];
      const today = new Date();
      const dayOfWeek = today.getDay(); 
      const upcoming = [];
      for(let i=0; i<7; i++){
        const targetDay = (dayOfWeek + i) % 7;
        const daySchedules = schedules.filter(s => {
          const scheduleDayMap = {'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3, 'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6};
          return s.academyId === studentData.academyId && scheduleDayMap[s.dayOfWeek] === targetDay;
        });
        upcoming.push(...daySchedules.map(s => ({...s, dayOffset: i})));
      }
      return upcoming.slice(0, 5);
    }, [schedules, studentData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].type === 'application/pdf') {
                setReceiptFile(e.target.files[0]);
            } else {
                alert('Por favor, selecione um arquivo PDF.');
                e.target.value = ''; // Clear the input
                setReceiptFile(null);
            }
        }
    };

    const handleSendReceipt = async () => {
        if (!studentData || !receiptFile) return;
        setIsPaying(true);
        await updateStudentPayment(studentData.id, 'paid');
        setIsPaying(false);
        setShowPaymentForm(false);
        setReceiptFile(null);
        setPaymentSuccess(true);
        setTimeout(() => {
            setPaymentSuccess(false);
        }, 3000);
    };


    if (loading || !studentData || !graduation) {
        return <div className="text-center">Carregando seus dados...</div>;
    }

    return (
        <div className="space-y-6">
            {!studentProp && (
              <div>
                  <h1 className="text-3xl font-bold text-slate-800">Olá, {studentData.name.split(' ')[0]}!</h1>
                  <p className="text-slate-500 mt-1">Aqui está um resumo do seu progresso no Jiu-Jitsu.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<IconMedal/>} title="Graduação Atual" color="#8B5CF6" value={graduation.name} />
                <Card className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-lg mr-4`} style={{ backgroundColor: `${studentData.paymentStatus === 'paid' ? '#10B981' : '#EF4444'}1A`}}>
                                <div style={{ color: studentData.paymentStatus === 'paid' ? '#10B981' : '#EF4444' }}><IconDollarSign/></div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Mensalidade</p>
                                {paymentSuccess ? (
                                    <p className="text-xl font-bold text-green-600">Pagamento Enviado!</p>
                                ) : (
                                    <p className="text-xl font-bold text-slate-800">{studentData.paymentStatus === 'paid' ? 'Em Dia' : 'Pendente'}</p>
                                )}
                            </div>
                        </div>
                        {studentData.paymentStatus === 'unpaid' && !studentProp && !showPaymentForm && !paymentSuccess && (
                            <Button size="sm" onClick={() => setShowPaymentForm(true)}>Pagar Agora</Button>
                        )}
                    </div>
                    {showPaymentForm && (
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-fade-in-down">
                            <p>Valor da mensalidade: <span className="font-bold">{themeSettings.monthlyFeeAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                             <label
                                htmlFor="receipt-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <IconUpload className="w-8 h-8 mb-3 text-slate-400" />
                                    <p className="mb-2 text-sm text-slate-500">
                                        <span className="font-semibold">Clique para enviar comprovante</span>
                                    </p>
                                    <p className="text-xs text-slate-500">Apenas arquivos PDF (obrigatório)</p>
                                </div>
                                <input id="receipt-upload" type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                            </label>
                            {receiptFile && (
                                <p className="text-center text-sm text-green-600 font-medium">Arquivo: {receiptFile.name}</p>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" size="sm" onClick={() => {setShowPaymentForm(false); setReceiptFile(null);}}>Cancelar</Button>
                                <Button size="sm" onClick={handleSendReceipt} disabled={!receiptFile || isPaying}>
                                    {isPaying ? 'Enviando...' : 'Enviar Comprovante'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
                <StatCard icon={<IconCalendar/>} title="Tempo de Treino" color="#3B82F6" value={`${Math.floor(trainingMonths/12)} anos e ${trainingMonths%12} meses`} />
                <StatCard icon={<IconAward/>} title="Próxima Graduação" color="#F59E0B" value={timeToNextGrad || "Parabéns!"} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Sua Progressão</h3>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-slate-700">{graduation.name}</span>
                                <span className="font-bold text-slate-700">{nextGraduation?.name || 'Faixa Preta'}</span>
                            </div>
                             <div className="w-full h-7 rounded-md flex items-center justify-end" style={{ backgroundColor: graduation.color, border: '1px solid rgba(0,0,0,0.1)' }}>
                                <div className="h-full w-1/4 bg-black flex items-center justify-center space-x-1 p-1">
                                    {Array.from({ length: stripes }).map((_, index) => (
                                        <div key={index} className="h-5 w-1 bg-white"></div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 mt-2 text-center">Você tem {stripes} grau(s) na sua faixa {graduation.name}.</p>
                        </div>

                         <div className="mt-6">
                            <h4 className="font-semibold text-amber-600">Dicas do Mestre para sua Próxima Graduação</h4>
                            <ul className="list-disc list-inside mt-2 text-slate-600 space-y-1">
                                <li>Concentre-se em refinar sua guarda-aranha, especialmente as transições para o triângulo.</li>
                                <li>Aumente sua participação nos treinos de sexta-feira para focar mais em rolas de competição.</li>
                                <li>Estude as defesas de chave de pé reta; é um ponto a ser melhorado para a faixa roxa.</li>
                            </ul>
                         </div>
                    </Card>
                </div>
                <div>
                   <StudentAttendanceChart studentId={studentData.id} />
                </div>
            </div>

             <Card>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Próximas Aulas na Semana</h3>
                {studentSchedules.length > 0 ? (
                    <div className="space-y-3">
                    {studentSchedules.map((schedule, i) => {
                        const classDate = new Date();
                        classDate.setDate(classDate.getDate() + schedule.dayOffset);
                        return (
                            <div key={`${schedule.id}-${i}`} className="flex items-center p-3 bg-slate-50 rounded-lg">
                                <div className="text-center w-16 mr-4">
                                    <p className="font-bold text-amber-600">{classDate.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                                    <p className="text-sm text-slate-500">{classDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{schedule.className}</p>
                                    <p className="text-sm text-slate-600">{schedule.startTime} - {schedule.endTime}</p>
                                </div>
                            </div>
                        )
                    })}
                    </div>
                ): (
                    <p className="text-slate-500 text-center">Nenhuma aula encontrada para você esta semana.</p>
                )}
            </Card>
        </div>
    );
};

export default StudentDashboard;