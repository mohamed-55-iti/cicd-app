pipeline {
    agent { label 'docker' }

    environment {
        DOCKERHUB_USER = 'mohamed11755'
        IMAGE_NAME     = 'cicd-app'
        GITOPS_REPO    = 'github.com/mohamed-55-iti/argocd.git'
        IMAGE          = "${DOCKERHUB_USER}/${IMAGE_NAME}"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.SHORT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.TAG = "${BUILD_NUMBER}-${SHORT_SHA}"
                }
            }
        }

        stage('Test') {
            steps {
                sh 'docker build --target test -t ${IMAGE}:test-${BUILD_NUMBER} .'
            }
        }

        stage('Build') {
            steps {
                sh '''
                    docker build --build-arg APP_VERSION=${TAG} \
                      -t ${IMAGE}:${TAG} -t ${IMAGE}:latest .
                '''
            }
        }

        stage('Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                        usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh '''
                        echo "$PASS" | docker login -u "$USER" --password-stdin
                        docker push ${IMAGE}:${TAG}
                        docker push ${IMAGE}:latest
                        docker logout
                    '''
                }
            }
        }

        stage('Update GitOps (dev)') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-creds',
                        usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                    sh '''
                        rm -rf gitops && git clone https://${GIT_USER}:${GIT_PASS}@${GITOPS_REPO} gitops
                        cd gitops
                        sed -i "s|newTag:.*|newTag: \\"${TAG}\\"|" apps/myapp/overlays/dev/kustomization.yaml
                        git config user.email "jenkins@ci.local"
                        git config user.name  "Jenkins"
                        git add -A
                        git commit -m "dev: ${IMAGE_NAME} -> ${TAG}" || echo "nothing to commit"
                        git push origin main
                    '''
                }
            }
        }

        stage('Approve Prod') {
            steps {
                timeout(time: 30, unit: 'MINUTES') {
                    input message: "Promote ${TAG} to PROD?", ok: 'Deploy'
                }
            }
        }

        stage('Update GitOps (prod)') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-creds',
                        usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                    sh '''
                        cd gitops
                        git pull --rebase origin main
                        sed -i "s|newTag:.*|newTag: \\"${TAG}\\"|" apps/myapp/overlays/prod/kustomization.yaml
                        git add -A
                        git commit -m "prod: ${IMAGE_NAME} -> ${TAG}" || echo "nothing to commit"
                        git push origin main
                    '''
                }
            }
        }
    }

    post {
        always  { sh 'docker image prune -f || true' }
        success { echo "Build ${BUILD_NUMBER} (${TAG}) succeeded" }
        failure { echo "Build ${BUILD_NUMBER} failed" }
    }
}
