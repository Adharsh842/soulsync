FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY . .

RUN mvn clean package

ENTRYPOINT ["java","-jar","target/*.jar"]