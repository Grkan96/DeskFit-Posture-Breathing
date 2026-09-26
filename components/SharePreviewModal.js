import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import ShareCard from './ShareCard';
import { getStats } from '../lib/stats';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { shareAchievementImage } from '../lib/sharing';
import { registerSharePreviewListener } from '../lib/sharePreview';

// "İlerlemeni paylaş" önizlemesi: kullanıcı ne paylaşacağını görür, sonra
// kart görsel olarak yakalanıp paylaşılır. App.js'de bir kez render edilir;
// lib/sharePreview.js'deki openSharePreview() ile her yerden açılabilir.
export default function SharePreviewModal() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(null);
  const [data, setData] = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    return registerSharePreviewListener((payload) => {
      setMessage(payload?.message || null);
      // Önce çağıranın verdiği değerlerle göster, ardından güncel istatistiklerle tazele
      setData({
        streak: payload?.streak ?? 0,
        totalSessions: payload?.totalSessions ?? 0,
        history: payload?.history ?? {},
      });
      setVisible(true);
      getStats()
        .then((stats) =>
          setData({ streak: stats.streak, totalSessions: stats.totalSessions, history: stats.history })
        )
        .catch(() => {});
    });
  }, []);

  function close() {
    if (sharing) return;
    setVisible(false);
  }

  async function handleShare() {
    if (!data || sharing) return;
    setSharing(true);
    try {
      await shareAchievementImage(cardRef, data);
    } catch (e) {
      // shareAchievementImage kendi içinde metne düşer; burası sadece emniyet
    }
    setSharing(false);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        {/* İçeriğe dokunmak modalı kapatmasın */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{t('shareCard.previewTitle')}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.cardWrap}>
            {data ? (
              <ShareCard
                ref={cardRef}
                streak={data.streak}
                totalSessions={data.totalSessions}
                history={data.history}
              />
            ) : null}
          </View>

          <Pressable
            onPress={handleShare}
            disabled={sharing}
            style={({ pressed }) => [styles.shareButton, (pressed || sharing) && styles.pressed]}
          >
            {sharing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.shareButtonText}>{t('shareCard.shareButton')}</Text>
            )}
          </Pressable>
          <Pressable onPress={close} style={styles.closeButton} hitSlop={10}>
            <Text style={styles.closeText}>{t('sharing.closeCta')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },
    sheet: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.bg,
      borderRadius: 24,
      paddingHorizontal: 12,
      paddingTop: 20,
      paddingBottom: 12,
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      marginTop: 6,
      fontSize: 14,
      fontWeight: '600',
      color: colors.subtext,
      textAlign: 'center',
    },
    cardWrap: {
      marginTop: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    shareButton: {
      alignSelf: 'stretch',
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    pressed: {
      opacity: 0.8,
    },
    shareButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ffffff',
    },
    closeButton: {
      marginTop: 10,
      paddingVertical: 8,
      alignItems: 'center',
    },
    closeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.muted,
    },
  });
}
