# 📚 우리 반 독서실 (스터디 플래너)

중학생 학급용 스터디 플래너 웹앱이에요. 학생이 캐릭터를 골라 가상 독서실에 앉으면 출석이 되고,
월·주·하루 계획, 공부 타이머(⭐ 별), 한 줄 회고, 내가 낸 퀴즈, 주간 리포트를 함께 써요.
선생님은 학생 현황·별 순위·CSV 내보내기를 볼 수 있어요.

- 데이터는 **선생님 본인의 구글 시트**에만 저장돼요.
- 서버는 **선생님 본인의 Vercel (무료)** 에서 돌아가요.

## 우리 반에 설치하기

👉 **[설치 안내서 (클릭만으로, 30분)](docs/설치안내.md)** 를 먼저 읽고 1~3단계를 끝낸 뒤, 아래 버튼을 누르세요.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpesongv%2Fstudy-planner-template&env=GOOGLE_SERVICE_ACCOUNT_EMAIL%2CGOOGLE_PRIVATE_KEY%2CGOOGLE_SHEET_ID%2CJWT_SECRET%2CTEACHER_INIT_PASSWORD&envDescription=%EC%84%A4%EC%B9%98+%EC%95%88%EB%82%B4%EC%84%9C+2~4%EB%8B%A8%EA%B3%84%EC%97%90%EC%84%9C+%EB%AA%A8%EC%9D%80+%EA%B0%92+5%EA%B0%9C%EB%A5%BC+%EB%84%A3%EC%96%B4+%EC%A3%BC%EC%84%B8%EC%9A%94&envLink=https%3A%2F%2Fgithub.com%2Fpesongv%2Fstudy-planner-template%2Fblob%2Fmain%2Fdocs%2F%25EC%2584%25A4%25EC%25B9%2598%25EC%2595%2588%25EB%2582%25B4.md&project-name=study-planner&repository-name=study-planner)

막히면 안내서를 Claude나 ChatGPT에 붙여 넣고 물어보세요.

## 그 밖에
- 기능 명세: [study-planner-spec.md](study-planner-spec.md)
- 캐릭터 그림 출처: [public/characters/LICENSES.md](public/characters/LICENSES.md)
- 개발자용 로컬 실행: `npm install` → `.env.local` 에 값 5개 → `npm run dev` (점검: `npm run check`)
