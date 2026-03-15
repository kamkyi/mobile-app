import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DEFAULT_ELECTRONICS_COINS,
  MAX_ROLE_GALLERY_IMAGES,
  MAX_SHOP_PRODUCT_IMAGES,
  PROFILE_MODE_ACTIVITY,
  PROFILE_MODE_CONFIG,
  PROFILE_MODE_ORDER,
  SHOP_OWNER_SAMPLE_PRODUCTS,
  type ManagedProfileMode,
} from "@/constants/profile-mode";
import {
  PROFESSIONAL_GENDER_OPTIONS,
  PROFESSIONAL_ROLE_OPTIONS,
  normalizeProfessionalGenders,
  normalizeProfessionalRoles,
} from "@/constants/professional";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import type {
  ProfessionalRoleImageCollection,
  ProfessionalShopProduct,
  StoredProfessionalProfile,
} from "@/db/types";
import { useScreenLayout } from "@/hooks/use-screen-layout";

function getRoleLabel(role: string) {
  const option = PROFESSIONAL_ROLE_OPTIONS.find((item) => item.key === role);

  if (!option) {
    return role
      .split("-")
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");
  }

  return option.key
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getManagedProfileModes(values: string[]) {
  return PROFILE_MODE_ORDER.filter((mode) => values.includes(mode));
}

function upsertRoleImageCollection(
  collections: ProfessionalRoleImageCollection[],
  role: ManagedProfileMode,
  imageUris: string[],
) {
  const nextCollections = collections.filter((item) => item.role !== role);

  if (imageUris.length === 0) {
    return nextCollections;
  }

  return [
    { role, imageUris: imageUris.slice(0, MAX_ROLE_GALLERY_IMAGES) },
    ...nextCollections,
  ];
}

async function requestImagePickerPermission() {
  if (Platform.OS === "web") {
    return true;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return permission.granted;
}

async function pickSingleImageUri() {
  const hasPermission = await requestImagePickerPermission();

  if (!hasPermission) {
    Alert.alert(
      "Photo access needed",
      "Allow Link to access your photo library to choose an image.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.4,
    base64: true,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return asset.base64
    ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
    : asset.uri;
}

function buildProfileSaveInput(
  profile: StoredProfessionalProfile,
  overrides: Partial<
    Pick<
      StoredProfessionalProfile,
      "roleImageCollections" | "shopProducts" | "walletCoins"
    >
  >,
) {
  return {
    roles: profile.roles,
    genders: profile.genders,
    nickname: profile.nickname,
    dateOfBirth: profile.dateOfBirth,
    serviceLocation: profile.serviceLocation,
    serviceLatitude: profile.serviceLatitude,
    serviceLongitude: profile.serviceLongitude,
    bio: profile.bio,
    profileImageUri: profile.profileImageUri,
    walletCoins: overrides.walletCoins ?? profile.walletCoins,
    roleImageCollections:
      overrides.roleImageCollections ?? profile.roleImageCollections,
    shopProducts: overrides.shopProducts ?? profile.shopProducts,
  };
}

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { currentProfessionalProfile, saveProfessionalProfile } = useAppData();
  const { contentContainerStyle } = useScreenLayout({
    bottomPadding: 32,
    gap: 14,
  });
  const [activeMode, setActiveMode] = useState<ManagedProfileMode | null>(null);
  const [isPersistingExtras, setIsPersistingExtras] = useState(false);
  const [productTitle, setProductTitle] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [draftProductImages, setDraftProductImages] = useState<string[]>([]);

  const roles = normalizeProfessionalRoles(currentProfessionalProfile?.roles ?? []);
  const genders = normalizeProfessionalGenders(currentProfessionalProfile?.genders ?? []);
  const managedModes = useMemo(() => getManagedProfileModes(roles), [roles]);

  useEffect(() => {
    if (managedModes.length === 0) {
      setActiveMode(null);
      return;
    }

    setActiveMode((currentMode) =>
      currentMode && managedModes.includes(currentMode)
        ? currentMode
        : managedModes[0],
    );
  }, [managedModes]);

  const walletCoins =
    currentProfessionalProfile?.walletCoins ?? DEFAULT_ELECTRONICS_COINS;
  const activeModeConfig = activeMode ? PROFILE_MODE_CONFIG[activeMode] : null;
  const activeGalleryImages = activeMode
    ? currentProfessionalProfile?.roleImageCollections.find(
        (item) => item.role === activeMode,
      )?.imageUris ?? []
    : [];
  const savedShopProducts = currentProfessionalProfile?.shopProducts ?? [];
  const displayedProducts =
    savedShopProducts.length > 0 ? savedShopProducts : [...SHOP_OWNER_SAMPLE_PRODUCTS];

  const handleEditProfile = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const route =
      roles.length > 0
        ? `/professional/profile?roles=${roles.join(",")}`
        : "/professional";

    router.push(route as never);
  };

  const persistProfileExtras = async (
    overrides: Partial<
      Pick<
        StoredProfessionalProfile,
        "roleImageCollections" | "shopProducts" | "walletCoins"
      >
    >,
  ) => {
    if (!currentProfessionalProfile) {
      handleEditProfile();
      return;
    }

    try {
      setIsPersistingExtras(true);
      await saveProfessionalProfile(
        buildProfileSaveInput(currentProfessionalProfile, overrides),
      );
    } catch (error) {
      console.warn("Failed to save profile extras", error);
      Alert.alert(
        "Could not update profile extras",
        "Please try again.",
      );
    } finally {
      setIsPersistingExtras(false);
    }
  };

  const handleAddBusinessImage = async () => {
    if (!activeMode) {
      return;
    }

    if (!currentProfessionalProfile) {
      handleEditProfile();
      return;
    }

    if (activeGalleryImages.length >= MAX_ROLE_GALLERY_IMAGES) {
      Alert.alert(
        "Gallery limit reached",
        `You can add up to ${MAX_ROLE_GALLERY_IMAGES} images for each role.`,
      );
      return;
    }

    const nextImageUri = await pickSingleImageUri();
    if (!nextImageUri) {
      return;
    }

    const nextCollections = upsertRoleImageCollection(
      currentProfessionalProfile.roleImageCollections,
      activeMode,
      [...activeGalleryImages, nextImageUri],
    );

    await persistProfileExtras({ roleImageCollections: nextCollections });
  };

  const handleRemoveBusinessImage = async (imageUri: string) => {
    if (!activeMode || !currentProfessionalProfile) {
      return;
    }

    const nextCollections = upsertRoleImageCollection(
      currentProfessionalProfile.roleImageCollections,
      activeMode,
      activeGalleryImages.filter((uri) => uri !== imageUri),
    );

    await persistProfileExtras({ roleImageCollections: nextCollections });
  };

  const handleAddDraftProductImage = async () => {
    if (draftProductImages.length >= MAX_SHOP_PRODUCT_IMAGES) {
      Alert.alert(
        "Product image limit reached",
        `Each product can have up to ${MAX_SHOP_PRODUCT_IMAGES} images.`,
      );
      return;
    }

    const nextImageUri = await pickSingleImageUri();
    if (!nextImageUri) {
      return;
    }

    setDraftProductImages((currentValue) => [
      ...currentValue,
      nextImageUri,
    ]);
  };

  const handleRemoveDraftProductImage = (imageUri: string) => {
    setDraftProductImages((currentValue) =>
      currentValue.filter((uri) => uri !== imageUri),
    );
  };

  const handleCreateProduct = async () => {
    if (!currentProfessionalProfile) {
      handleEditProfile();
      return;
    }

    const trimmedTitle = productTitle.trim();
    const trimmedDescription = productDescription.trim();
    const parsedPrice = Number(productPrice);

    if (!trimmedTitle) {
      Alert.alert("Product title required", "Enter a product title.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Invalid price", "Enter a price greater than zero.");
      return;
    }

    const nextProduct: ProfessionalShopProduct = {
      id: `product-${Date.now().toString(36)}`,
      title: trimmedTitle,
      description: trimmedDescription || undefined,
      price: parsedPrice,
      imageUris: draftProductImages.slice(0, MAX_SHOP_PRODUCT_IMAGES),
      createdAt: new Date().toISOString(),
    };

    await persistProfileExtras({
      shopProducts: [nextProduct, ...currentProfessionalProfile.shopProducts],
    });

    setProductTitle("");
    setProductPrice("");
    setProductDescription("");
    setDraftProductImages([]);
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!currentProfessionalProfile) {
      return;
    }

    await persistProfileExtras({
      shopProducts: currentProfessionalProfile.shopProducts.filter(
        (item) => item.id !== productId,
      ),
    });
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          {currentProfessionalProfile?.profileImageUri ? (
            <Image
              source={{ uri: currentProfessionalProfile.profileImageUri }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={180}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.name ?? "User")}
              </Text>
            </View>
          )}
          <Text style={styles.headerTitle}>{user?.name ?? "Your profile"}</Text>
          <Text style={styles.headerBody}>
            {user?.email ?? "Log in to save your profile."}
          </Text>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletCopy}>
            <Text style={styles.walletEyebrow}>My wallet</Text>
            <Text style={styles.walletTitle}>{walletCoins.toLocaleString()} Electronics Coins</Text>
            <Text style={styles.walletBody}>
              Wallet balance shown on the profile main page for dummy use.
            </Text>
          </View>
          <View style={styles.walletIconWrap}>
            <Ionicons color="#B45309" name="wallet-outline" size={24} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Professional profile</Text>
          <Text style={styles.primaryText}>
            {currentProfessionalProfile?.nickname ?? "No professional nickname saved yet."}
          </Text>
          <Text style={styles.secondaryText}>
            {currentProfessionalProfile?.bio ??
              "Add roles, genders, and a short intro so your profile appears well in the list."}
          </Text>
          {currentProfessionalProfile?.serviceLocation ? (
            <Text style={styles.secondaryText}>
              Service location: {currentProfessionalProfile.serviceLocation}
            </Text>
          ) : null}

          <View style={styles.chipRow}>
            {roles.map((role) => (
              <View key={role} style={styles.roleChip}>
                <Text style={styles.roleChipText}>{getRoleLabel(role)}</Text>
              </View>
            ))}
            {genders.map((gender) => {
              const option = PROFESSIONAL_GENDER_OPTIONS.find(
                (item) => item.key === gender,
              );

              return (
                <View key={gender} style={styles.genderChip}>
                  <Text style={styles.genderChipText}>
                    {option?.label ?? gender}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {managedModes.length > 0 ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Profile modes</Text>
              <Text style={styles.secondaryText}>
                The profile main page now switches based on the roles you selected.
              </Text>
              <View style={styles.modeRow}>
                {managedModes.map((mode) => {
                  const config = PROFILE_MODE_CONFIG[mode];
                  const active = mode === activeMode;

                  return (
                    <Pressable
                      key={mode}
                      onPress={() => setActiveMode(mode)}
                      style={[
                        styles.modeChip,
                        active
                          ? {
                              backgroundColor: `${config.accentColor}16`,
                              borderColor: config.accentColor,
                            }
                          : null,
                      ]}
                    >
                      <Ionicons
                        color={active ? config.accentColor : "#64748B"}
                        name={config.iconName}
                        size={16}
                      />
                      <Text
                        style={[
                          styles.modeChipText,
                          active ? { color: config.accentColor } : null,
                        ]}
                      >
                        {config.tabLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {activeMode && activeModeConfig ? (
              <>
                <View
                  style={[
                    styles.modeSpotlightCard,
                    { borderColor: `${activeModeConfig.accentColor}40` },
                  ]}
                >
                  <View
                    style={[
                      styles.modeSpotlightIcon,
                      { backgroundColor: `${activeModeConfig.accentColor}16` },
                    ]}
                  >
                    <Ionicons
                      color={activeModeConfig.accentColor}
                      name={activeModeConfig.iconName}
                      size={18}
                    />
                  </View>
                  <View style={styles.modeSpotlightCopy}>
                    <Text style={styles.modeSpotlightTitle}>
                      {activeModeConfig.headline}
                    </Text>
                    <Text style={styles.secondaryText}>{activeModeConfig.summary}</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.sectionTitle}>
                        {activeModeConfig.tabLabel} business gallery
                      </Text>
                      <Text style={styles.secondaryText}>
                        {activeGalleryImages.length} / {MAX_ROLE_GALLERY_IMAGES} saved
                      </Text>
                    </View>
                    <Pressable
                      disabled={isPersistingExtras}
                      onPress={() => void handleAddBusinessImage()}
                      style={({ pressed }) => [
                        styles.inlineActionButton,
                        pressed && !isPersistingExtras
                          ? styles.actionButtonPressed
                          : null,
                      ]}
                    >
                      {isPersistingExtras ? (
                        <ActivityIndicator color="#2563EB" />
                      ) : (
                        <>
                          <Ionicons color="#2563EB" name="add" size={16} />
                          <Text style={styles.inlineActionText}>Add image</Text>
                        </>
                      )}
                    </Pressable>
                  </View>

                  {activeGalleryImages.length > 0 ? (
                    <View style={styles.galleryGrid}>
                      {activeGalleryImages.map((uri) => (
                        <View key={uri} style={styles.galleryCard}>
                          <Image
                            source={{ uri }}
                            style={styles.galleryImage}
                            contentFit="cover"
                            transition={180}
                          />
                          <Pressable
                            onPress={() => void handleRemoveBusinessImage(uri)}
                            style={styles.removeImageButton}
                          >
                            <Ionicons color="#FFFFFF" name="close" size={14} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyGalleryCard}>
                      <Ionicons
                        color={activeModeConfig.accentColor}
                        name={activeModeConfig.iconName}
                        size={20}
                      />
                      <Text style={styles.secondaryText}>
                        {activeModeConfig.emptyGalleryLabel}
                      </Text>
                    </View>
                  )}
                </View>

                {activeMode === "shop-owner" ? (
                  <>
                    <View style={styles.card}>
                      <Text style={styles.sectionTitle}>Create product</Text>
                      <Text style={styles.secondaryText}>
                        Add a product for your shop profile. Each product can have up to 4 images.
                      </Text>

                      <Text style={styles.fieldLabel}>Product title</Text>
                      <TextInput
                        autoCapitalize="words"
                        autoCorrect={false}
                        onChangeText={setProductTitle}
                        placeholder="Deluxe facial kit"
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        value={productTitle}
                      />

                      <Text style={styles.fieldLabel}>Price</Text>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="decimal-pad"
                        onChangeText={setProductPrice}
                        placeholder="39"
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        value={productPrice}
                      />

                      <Text style={styles.fieldLabel}>Description</Text>
                      <TextInput
                        autoCapitalize="sentences"
                        autoCorrect
                        multiline
                        onChangeText={setProductDescription}
                        placeholder="Describe why customers should buy this product."
                        placeholderTextColor="#94A3B8"
                        style={[styles.textInput, styles.textAreaInput]}
                        textAlignVertical="top"
                        value={productDescription}
                      />

                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.sectionTitleSmall}>
                          Product images ({draftProductImages.length}/{MAX_SHOP_PRODUCT_IMAGES})
                        </Text>
                        <Pressable
                          onPress={() => void handleAddDraftProductImage()}
                          style={({ pressed }) => [
                            styles.inlineActionButton,
                            pressed ? styles.actionButtonPressed : null,
                          ]}
                        >
                          <Ionicons color="#2563EB" name="images-outline" size={16} />
                          <Text style={styles.inlineActionText}>Add photo</Text>
                        </Pressable>
                      </View>

                      {draftProductImages.length > 0 ? (
                        <View style={styles.galleryGrid}>
                          {draftProductImages.map((uri) => (
                            <View key={uri} style={styles.galleryCard}>
                              <Image
                                source={{ uri }}
                                style={styles.galleryImage}
                                contentFit="cover"
                                transition={180}
                              />
                              <Pressable
                                onPress={() => handleRemoveDraftProductImage(uri)}
                                style={styles.removeImageButton}
                              >
                                <Ionicons color="#FFFFFF" name="close" size={14} />
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.fieldHint}>
                          Add up to 4 images for this product.
                        </Text>
                      )}

                      <Pressable
                        disabled={isPersistingExtras}
                        onPress={() => void handleCreateProduct()}
                        style={({ pressed }) => [
                          styles.secondaryCtaButton,
                          pressed && !isPersistingExtras
                            ? styles.actionButtonPressed
                            : null,
                        ]}
                      >
                        {isPersistingExtras ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.secondaryCtaButtonText}>
                              Save product
                            </Text>
                            <Ionicons
                              color="#FFFFFF"
                              name="checkmark-circle-outline"
                              size={18}
                            />
                          </>
                        )}
                      </Pressable>
                    </View>

                    <View style={styles.card}>
                      <Text style={styles.sectionTitle}>Shop products</Text>
                      <Text style={styles.secondaryText}>
                        Dummy products appear until you save your own shop items.
                      </Text>

                      <View style={styles.productList}>
                        {displayedProducts.map((product) => {
                          const isSavedProduct = savedShopProducts.some(
                            (savedProduct) => savedProduct.id === product.id,
                          );

                          return (
                            <View key={product.id} style={styles.productCard}>
                              <View style={styles.productHeader}>
                                <View style={styles.productHeaderCopy}>
                                  <Text style={styles.productTitle}>{product.title}</Text>
                                  <Text style={styles.productPrice}>
                                    ${product.price.toFixed(2)}
                                  </Text>
                                </View>
                                {isSavedProduct ? (
                                  <Pressable
                                    onPress={() => void handleRemoveProduct(product.id)}
                                    style={({ pressed }) => [
                                      styles.deleteChip,
                                      pressed ? styles.actionButtonPressed : null,
                                    ]}
                                  >
                                    <Text style={styles.deleteChipText}>Remove</Text>
                                  </Pressable>
                                ) : (
                                  <View style={styles.sampleChip}>
                                    <Text style={styles.sampleChipText}>Dummy</Text>
                                  </View>
                                )}
                              </View>
                              {product.description ? (
                                <Text style={styles.secondaryText}>{product.description}</Text>
                              ) : null}
                              {product.imageUris.length > 0 ? (
                                <ScrollView
                                  horizontal
                                  contentContainerStyle={styles.productImageRow}
                                  showsHorizontalScrollIndicator={false}
                                >
                                  {product.imageUris.map((uri) => (
                                    <Image
                                      key={`${product.id}-${uri}`}
                                      source={{ uri }}
                                      style={styles.productImage}
                                      contentFit="cover"
                                      transition={180}
                                    />
                                  ))}
                                </ScrollView>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </>
                ) : null}

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>{activeModeConfig.headline}</Text>
                  <Text style={styles.secondaryText}>
                    Dummy data shown based on the selected professional tab.
                  </Text>

                  <View style={styles.requestList}>
                    {PROFILE_MODE_ACTIVITY[activeMode].map((item) => (
                      <View key={item.id} style={styles.requestCard}>
                        <View
                          style={[
                            styles.requestIconWrap,
                            { backgroundColor: `${item.accentColor}16` },
                          ]}
                        >
                          <Ionicons
                            color={item.accentColor}
                            name={item.iconName}
                            size={18}
                          />
                        </View>
                        <View style={styles.requestCopy}>
                          <Text style={styles.requestTitle}>{item.title}</Text>
                          <Text style={styles.secondaryText}>{item.body}</Text>
                          <Text style={styles.requestMeta}>{item.meta}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : null}
          </>
        ) : roles.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profile modes</Text>
            <Text style={styles.secondaryText}>
              Role-specific tabs are available for Doctor, Dater, Driver, and Shop Owner.
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleEditProfile}
          style={({ pressed }) => [
            styles.actionButton,
            pressed ? styles.actionButtonPressed : null,
          ]}
        >
          <Text style={styles.actionButtonText}>
            {roles.length > 0 ? "Edit profile" : "Create profile"}
          </Text>
          <Ionicons color="#FFFFFF" name="chevron-forward" size={18} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E2E8F0",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  headerTitle: {
    marginTop: 12,
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
  },
  headerBody: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },
  walletCard: {
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  walletCopy: {
    flex: 1,
    gap: 4,
  },
  walletEyebrow: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  walletTitle: {
    color: "#78350F",
    fontSize: 22,
    fontWeight: "800",
  },
  walletBody: {
    color: "#A16207",
    fontSize: 13,
    lineHeight: 19,
  },
  walletIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  sectionTitleSmall: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  primaryText: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  secondaryText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roleChipText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  genderChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  genderChipText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2,
  },
  modeChip: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeChipText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },
  modeSpotlightCard: {
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  modeSpotlightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modeSpotlightCopy: {
    flex: 1,
    gap: 4,
  },
  modeSpotlightTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },
  inlineActionButton: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  inlineActionText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  galleryCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(15,23,42,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyGalleryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    padding: 18,
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    marginTop: 2,
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  fieldHint: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
  textInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DFEA",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 14,
  },
  textAreaInput: {
    minHeight: 96,
    paddingTop: 12,
    paddingBottom: 12,
  },
  secondaryCtaButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  secondaryCtaButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  productList: {
    gap: 12,
  },
  productCard: {
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    padding: 14,
    gap: 10,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  productHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  productTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  productPrice: {
    color: "#D97706",
    fontSize: 14,
    fontWeight: "800",
  },
  productImageRow: {
    gap: 10,
  },
  productImage: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },
  sampleChip: {
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sampleChipText: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "800",
  },
  deleteChip: {
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteChipText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "800",
  },
  requestList: {
    gap: 12,
  },
  requestCard: {
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  requestIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  requestCopy: {
    flex: 1,
    gap: 4,
  },
  requestTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  requestMeta: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  actionButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
