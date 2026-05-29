#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

case "${1:-}" in
  start)
    echo "Démarrage MesHeures…"
    docker compose up --build -d
    echo "Disponible sur http://localhost"
    ;;
  stop)
    echo "Arrêt MesHeures…"
    docker compose down
    ;;
  restart)
    echo "Redémarrage MesHeures…"
    docker compose down
    docker compose up --build -d
    echo "Disponible sur http://localhost"
    ;;
  logs)
    docker compose logs -f
    ;;
  status)
    docker compose ps
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|status}"
    exit 1
    ;;
esac
